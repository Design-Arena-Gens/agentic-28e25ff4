"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { initialPosState } from "@/lib/sample-data";
import {
  CreateOrderInput,
  KotEvent,
  MenuItem,
  Order,
  OrderItem,
  PosState,
  Table,
  UpdateInventoryInput,
  UpdateMenuItemInput,
  UpdateTableStatusInput,
} from "@/lib/types";

type PosAction =
  | { type: "SYNC_FROM_STORAGE"; payload: PosState }
  | { type: "CREATE_ORDER"; payload: Order }
  | { type: "UPSERT_ORDER"; payload: Order }
  | { type: "DELETE_ORDER"; payload: { id: string } }
  | { type: "UPDATE_TABLE"; payload: Table }
  | { type: "UPSERT_KOT"; payload: KotEvent }
  | { type: "DELETE_KOT"; payload: { id: string } }
  | {
      type: "UPDATE_INVENTORY";
      payload: UpdateInventoryInput;
    }
  | {
      type: "UPDATE_MENU_ITEM";
      payload: UpdateMenuItemInput;
    }
  | {
      type: "TOGGLE_MENU_AVAILABILITY";
      payload: { id: string; isAvailable: boolean };
    }
  | {
      type: "BULK_UPDATE";
      payload: Partial<PosState>;
    };

type PosDispatch = (action: PosAction) => void;

interface PosContextValue extends PosState {
  dispatch: PosDispatch;
  createOrder: (input: CreateOrderInput) => string;
  addItemsToOrder: (
    orderId: string,
    items: Array<Omit<OrderItem, "id" | "price"> & { menuItemId: string }>
  ) => OrderItem[];
  fireOrderToKitchen: (orderId: string, station: KotEvent["station"], items?: OrderItem[]) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  recordPayment: (
    orderId: string,
    payment: Order["payments"][number]
  ) => void;
  adjustInventory: (input: UpdateInventoryInput) => void;
  updateMenuItem: (input: UpdateMenuItemInput) => void;
  updateTableStatus: (input: UpdateTableStatusInput) => void;
}

const PosContext = createContext<PosContextValue | undefined>(undefined);

const STORAGE_KEY = "agentic-cafe-pos";

const reducer = (state: PosState, action: PosAction): PosState => {
  switch (action.type) {
    case "SYNC_FROM_STORAGE": {
      return { ...action.payload };
    }
    case "CREATE_ORDER": {
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        lastSync: new Date().toISOString(),
      };
    }
    case "UPSERT_ORDER": {
      const exists = state.orders.find((o) => o.id === action.payload.id);
      return {
        ...state,
        orders: exists
          ? state.orders.map((o) => (o.id === action.payload.id ? action.payload : o))
          : [action.payload, ...state.orders],
        lastSync: new Date().toISOString(),
      };
    }
    case "DELETE_ORDER": {
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.payload.id),
        lastSync: new Date().toISOString(),
      };
    }
    case "UPDATE_TABLE": {
      return {
        ...state,
        tables: state.tables.map((table) =>
          table.id === action.payload.id ? action.payload : table
        ),
        lastSync: new Date().toISOString(),
      };
    }
    case "UPSERT_KOT": {
      const exists = state.kotTickets.find((k) => k.id === action.payload.id);
      return {
        ...state,
        kotTickets: exists
          ? state.kotTickets.map((k) => (k.id === action.payload.id ? action.payload : k))
          : [action.payload, ...state.kotTickets],
        lastSync: new Date().toISOString(),
      };
    }
    case "DELETE_KOT": {
      return {
        ...state,
        kotTickets: state.kotTickets.filter((k) => k.id !== action.payload.id),
        lastSync: new Date().toISOString(),
      };
    }
    case "UPDATE_INVENTORY": {
      return {
        ...state,
        inventory: state.inventory.map((item) =>
          item.id === action.payload.id
            ? {
                ...item,
                quantity:
                  action.payload.quantity ?? item.quantity,
                parLevel: action.payload.parLevel ?? item.parLevel,
              }
            : item
        ),
        lastSync: new Date().toISOString(),
      };
    }
    case "UPDATE_MENU_ITEM": {
      return {
        ...state,
        menu: state.menu.map((item) =>
          item.id === action.payload.id
            ? ({
                ...item,
                price: action.payload.price ?? item.price,
                isAvailable:
                  action.payload.isAvailable ?? item.isAvailable,
                tags: action.payload.tags ?? item.tags,
              } satisfies MenuItem)
            : item
        ),
        lastSync: new Date().toISOString(),
      };
    }
    case "TOGGLE_MENU_AVAILABILITY": {
      return {
        ...state,
        menu: state.menu.map((item) =>
          item.id === action.payload.id
            ? { ...item, isAvailable: action.payload.isAvailable }
            : item
        ),
        lastSync: new Date().toISOString(),
      };
    }
    case "BULK_UPDATE": {
      return {
        ...state,
        ...action.payload,
        lastSync: new Date().toISOString(),
      };
    }
    default:
      return state;
  }
};

const computeOrderTotals = (order: Order): number => {
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export const PosProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialPosState);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as PosState;
        dispatch({ type: "SYNC_FROM_STORAGE", payload: parsed });
      } catch (error) {
        console.warn("Failed to parse POS state from storage", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const createOrder = useCallback(
    (input: CreateOrderInput) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const items: OrderItem[] = input.items.map((item) => {
        const menuItem = state.menu.find((m) => m.id === item.menuItemId);
        if (!menuItem) {
          throw new Error("Menu item not found");
        }
        return {
          id: crypto.randomUUID(),
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: menuItem.price,
          note: item.note,
        };
      });

      const order: Order = {
        id,
        tableId: input.tableId,
        waiterId: input.waiterId,
        status: "pending",
        notes: input.notes,
        customerName: input.customerName,
        createdAt: now,
        updatedAt: now,
        items,
        payments: [],
      };

      dispatch({ type: "CREATE_ORDER", payload: order });

      if (input.tableId) {
        const table = state.tables.find((t) => t.id === input.tableId);
        if (table) {
          dispatch({
            type: "UPDATE_TABLE",
            payload: {
              ...table,
              status: "occupied",
              activeOrderId: order.id,
            },
          });
        }
      }

      return id;
    },
    [state.menu, state.tables]
  );

  const addItemsToOrder = useCallback(
    (
      orderId: string,
      items: Array<Omit<OrderItem, "id" | "price"> & { menuItemId: string }>
    ): OrderItem[] => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return [];
      const enhancedItems = items.map((item) => {
        const menuItem = state.menu.find((m) => m.id === item.menuItemId);
        if (!menuItem) {
          throw new Error("Menu item not found");
        }
        return {
          ...item,
          id: crypto.randomUUID(),
          price: menuItem.price,
        };
      });

      const updated: Order = {
        ...order,
        items: [...order.items, ...enhancedItems],
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "UPSERT_ORDER", payload: updated });

      return enhancedItems;
    },
    [state.menu, state.orders]
  );

  const consumeInventoryForItems = useCallback(
    (orderItems: OrderItem[]) => {
      const updates = new Map<string, number>();
      orderItems.forEach((item) => {
        const menuItem = state.menu.find((m) => m.id === item.menuItemId);
        if (!menuItem || !menuItem.recipeId) return;
        const recipe = state.recipes.find((r) => r.id === menuItem.recipeId);
        if (!recipe) return;
        recipe.ingredients.forEach((ingredient) => {
          const previous = updates.get(ingredient.inventoryItemId) ?? 0;
          updates.set(
            ingredient.inventoryItemId,
            previous + ingredient.quantity * item.quantity
          );
        });
      });

      updates.forEach((usedQuantity, inventoryId) => {
        const inventoryItem = state.inventory.find((inv) => inv.id === inventoryId);
        if (!inventoryItem) return;
        dispatch({
          type: "UPDATE_INVENTORY",
          payload: {
            id: inventoryId,
            quantity: Math.max(inventoryItem.quantity - usedQuantity, 0),
          },
        });
      });
    },
    [state.inventory, state.menu, state.recipes]
  );

  const fireOrderToKitchen = useCallback(
    (orderId: string, station: KotEvent["station"], items?: OrderItem[]) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return [];
      const now = new Date().toISOString();
      const updated: Order = {
        ...order,
        status: order.status === "pending" ? "in-progress" : order.status,
        firedToKitchenAt: order.firedToKitchenAt ?? now,
        updatedAt: now,
      };
      dispatch({ type: "UPSERT_ORDER", payload: updated });
      const kot: KotEvent = {
        id: crypto.randomUUID(),
        orderId: updated.id,
        firedAt: now,
        status: "new",
        station,
      };
      dispatch({ type: "UPSERT_KOT", payload: kot });

      const itemsToConsume = items ?? (order.firedToKitchenAt ? [] : order.items);
      if (itemsToConsume.length > 0) {
        consumeInventoryForItems(itemsToConsume);
      }
    },
    [consumeInventoryForItems, state.orders]
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: Order["status"]) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return [];
      const now = new Date().toISOString();
      const updated: Order = {
        ...order,
        status,
        updatedAt: now,
        readyAt: status === "ready" ? now : order.readyAt,
        servedAt: status === "served" ? now : order.servedAt,
      };
      dispatch({ type: "UPSERT_ORDER", payload: updated });

      if (status === "ready") {
        state.kotTickets
          .filter((ticket) => ticket.orderId === orderId)
          .forEach((ticket) =>
            dispatch({
              type: "UPSERT_KOT",
              payload: { ...ticket, status: "completed" },
            })
          );
      }

      if (status === "settled" && order.tableId) {
        const table = state.tables.find((t) => t.id === order.tableId);
        if (table) {
          dispatch({
            type: "UPDATE_TABLE",
            payload: {
              ...table,
              status: "dirty",
              activeOrderId: undefined,
            },
          });
        }
      }
    },
    [state.kotTickets, state.orders, state.tables]
  );

  const recordPayment = useCallback(
    (orderId: string, payment: Order["payments"][number]) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return [];
      const updated: Order = {
        ...order,
        payments: [...order.payments, payment],
        updatedAt: new Date().toISOString(),
      };
      const paid = updated.payments.reduce((sum, current) => sum + current.amount, 0);
      const total = computeOrderTotals(order);
      if (paid >= total && updated.status !== "settled") {
        updated.status = "settled";
      }
      dispatch({ type: "UPSERT_ORDER", payload: updated });
    },
    [state.orders]
  );

  const adjustInventory = useCallback(
    (input: UpdateInventoryInput) => {
      dispatch({ type: "UPDATE_INVENTORY", payload: input });
    },
    []
  );

  const updateMenuItem = useCallback((input: UpdateMenuItemInput) => {
    dispatch({ type: "UPDATE_MENU_ITEM", payload: input });
  }, []);

  const updateTableStatus = useCallback((input: UpdateTableStatusInput) => {
    const table = state.tables.find((t) => t.id === input.id);
    if (!table) return;
    dispatch({
      type: "UPDATE_TABLE",
      payload: {
        ...table,
        status: input.status,
        activeOrderId: input.activeOrderId ?? table.activeOrderId,
      },
    });
  }, [state.tables]);

  const value = useMemo<PosContextValue>(() => {
    return {
      ...state,
      dispatch,
      createOrder,
      addItemsToOrder,
      fireOrderToKitchen,
      updateOrderStatus,
      recordPayment,
      adjustInventory,
      updateMenuItem,
      updateTableStatus,
    };
  }, [
    state,
    createOrder,
    addItemsToOrder,
    fireOrderToKitchen,
    updateOrderStatus,
    recordPayment,
    adjustInventory,
    updateMenuItem,
    updateTableStatus,
  ]);

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
};

export const usePosStore = () => {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error("usePosStore must be used within a PosProvider");
  }
  return context;
};

