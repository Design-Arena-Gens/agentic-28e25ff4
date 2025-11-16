"use client";

import { useMemo, useState } from "react";
import { usePosStore } from "@/store/pos-store";
import { MenuItem, Order } from "@/lib/types";
import {
  BadgeCheck,
  ClipboardList,
  Utensils,
  Loader2,
  PlusCircle,
  UserRound,
} from "lucide-react";
import clsx from "clsx";

const QuickButton = ({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active?: boolean;
  color: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={clsx(
      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
      active
        ? "border-transparent text-white"
        : "border-zinc-200 text-zinc-600 hover:border-transparent hover:text-white dark:border-zinc-700 dark:text-zinc-300",
      active ? "" : ""
    )}
    style={{
      background: active ? color : "transparent",
      boxShadow: active ? `${color}33 0 10px 20px` : undefined,
    }}
  >
    <UserRound className="h-4 w-4" />
    {label}
  </button>
);

const QuickItem = ({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: () => void;
}) => (
  <button
    onClick={onAdd}
    disabled={!item.isAvailable}
    className={clsx(
      "flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm transition hover:border-emerald-400 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
      "dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/20",
      !item.isAvailable && "cursor-not-allowed opacity-60"
    )}
  >
    <div>
      <p className="font-semibold text-zinc-800 dark:text-zinc-100">{item.name}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {item.category} · ${item.price.toFixed(2)}
      </p>
    </div>
    <PlusCircle className="h-5 w-5 text-emerald-500" />
  </button>
);

export const WaiterConsole = () => {
  const {
    waiters,
    tables,
    menu,
    orders,
    createOrder,
    fireOrderToKitchen,
    updateOrderStatus,
    addItemsToOrder,
  } = usePosStore();

  const [activeWaiterId, setActiveWaiterId] = useState(waiters[0]?.id ?? "");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId),
    [tables, selectedTableId]
  );

  const activeOrder = useMemo<Order | undefined>(() => {
    if (!selectedTable?.activeOrderId) return undefined;
    return orders.find((order) => order.id === selectedTable.activeOrderId);
  }, [orders, selectedTable]);

  const quickItems = useMemo<MenuItem[]>(() => {
    return menu
      .filter((item) => item.isAvailable)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 12);
  }, [menu]);

  const stationMap: Record<MenuItem["category"], "kitchen" | "bar" | "pastry"> = {
    coffee: "bar",
    tea: "bar",
    pastry: "pastry",
    food: "kitchen",
    other: "kitchen",
  };

  const handleQuickAdd = (item: MenuItem) => {
    if (!selectedTable) return;
    if (activeOrder) {
      const newItems = addItemsToOrder(activeOrder.id, [
        { menuItemId: item.id, quantity: 1 },
      ]);
      fireOrderToKitchen(activeOrder.id, stationMap[item.category], newItems);
    } else {
      const orderId = createOrder({
        waiterId: activeWaiterId,
        tableId: selectedTable.id,
        items: [{ menuItemId: item.id, quantity: 1 }],
      });
      fireOrderToKitchen(orderId, stationMap[item.category]);
    }
  };

  const markServed = () => {
    if (activeOrder) {
      updateOrderStatus(activeOrder.id, "served");
    }
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-1/2">
        <div className="flex flex-wrap gap-2">
          {waiters.map((waiter) => (
            <QuickButton
              key={waiter.id}
              label={waiter.name}
              color={waiter.color}
              active={waiter.id === activeWaiterId}
              onClick={() => setActiveWaiterId(waiter.id)}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => setSelectedTableId((prev) => (prev === table.id ? null : table.id))}
              className={clsx(
                "flex flex-col rounded-3xl border px-4 py-3 text-left shadow-sm transition hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40",
                table.status === "occupied"
                  ? "border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-900/10"
                  : table.status === "reserved"
                  ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10"
                  : table.status === "dirty"
                  ? "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/10"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
                selectedTableId === table.id && "ring-2 ring-emerald-400"
              )}
            >
              <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {table.label}
              </span>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {table.status === "occupied" ? "In Service" : table.status}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {table.activeOrderId
                  ? `Ticket ${table.activeOrderId.slice(0, 6).toUpperCase()}`
                  : "No ticket"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 rounded-3xl border border-zinc-200 bg-white/80 p-5 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 lg:w-1/2">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Current Table</p>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {selectedTable?.label ?? "Select table"}
            </h3>
          </div>
          {selectedTable ? (
            <BadgeCheck className="h-5 w-5 text-emerald-500" />
          ) : (
            <ClipboardList className="h-5 w-5 text-zinc-400" />
          )}
        </header>

        {selectedTable ? (
          <>
            <div className="flex items-center justify-between rounded-2xl bg-emerald-50/80 px-4 py-3 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
              <span className="inline-flex items-center gap-2 font-semibold">
                <Utensils className="h-4 w-4" />
                {activeOrder
                  ? `Serving since ${new Date(activeOrder.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "No active ticket"}
              </span>
              {activeOrder && (
                <span>
                  $
                  {activeOrder.items
                    .reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    )
                    .toFixed(2)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {quickItems.map((item) => (
                <QuickItem key={item.id} item={item} onAdd={() => handleQuickAdd(item)} />
              ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={markServed}
                disabled={!activeOrder}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide",
                  activeOrder
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                )}
              >
                <BadgeCheck className="h-4 w-4" />
                Mark Served
              </button>
              <button
                onClick={() => activeOrder && updateOrderStatus(activeOrder.id, "settled")}
                disabled={!activeOrder}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-wide",
                  activeOrder
                    ? "border-emerald-500 text-emerald-600 hover:bg-emerald-500/10"
                    : "cursor-not-allowed border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
                )}
              >
                Settle Bill
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="mt-2 text-xs">Choose a table to start taking orders.</p>
          </div>
        )}
      </div>
    </div>
  );
};
