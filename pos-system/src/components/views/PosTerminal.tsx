"use client";

import { useMemo, useState } from "react";
import { usePosStore } from "@/store/pos-store";
import { MenuItem, Order } from "@/lib/types";
import { Coffee, Minus, Plus, Salad, Search, Send, Utensils } from "lucide-react";
import clsx from "clsx";

type CartEntry = {
  menuItem: MenuItem;
  quantity: number;
  note?: string;
};

const categoryLabels: Record<MenuItem["category"], string> = {
  coffee: "Coffee",
  tea: "Tea & Specialty",
  pastry: "Pastry",
  food: "Brunch & Food",
  other: "Other",
};

const stationMap: Record<MenuItem["category"], "bar" | "kitchen" | "pastry"> = {
  coffee: "bar",
  tea: "bar",
  pastry: "pastry",
  food: "kitchen",
  other: "kitchen",
};


const SectionCard = ({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={clsx(
      "flex flex-1 flex-col rounded-2xl border border-zinc-200 bg-white/70 shadow-sm backdrop-blur",
      "dark:border-zinc-800 dark:bg-zinc-900/70",
      className
    )}
  >
    <header className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
    </header>
    <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
  </section>
);

const CroissantIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
    <path
      d="M9 7C7 4 3 4 2 8c2 2 4 2 6 2m6-3c2-3 6-3 7 1-2 2-4 2-6 2m-7 8c-3 2-6 0-6-3 2-1 4-1 6-2m8 5c3 2 6 0 6-3-2-1-4-1-6-2"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 8c-.5 2.5-.5 5.5 0 8m6-8c.5 2.5.5 5.5 0 8"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MenuCard = ({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: () => void;
}) => {
  const iconByCategory: Record<MenuItem["category"], React.ReactNode> = {
    coffee: <Coffee className="h-5 w-5" />,
    tea: <Coffee className="h-5 w-5" />,
    pastry: <CroissantIcon />,
    food: <Utensils className="h-5 w-5" />,
    other: <Salad className="h-5 w-5" />,
  };

  return (
    <button
      onClick={onAdd}
      disabled={!item.isAvailable}
      className={clsx(
        "group flex flex-col rounded-xl border border-zinc-200 bg-white p-4 text-left transition-all",
        "hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
        "dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-400",
        !item.isAvailable && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white dark:bg-emerald-900/40 dark:text-emerald-300">
          {iconByCategory[item.category]}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {item.name}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {categoryLabels[item.category]}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          ${item.price.toFixed(2)}
        </span>
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {tag}
            </span>
          ))}
          {!item.isAvailable && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const CartRow = ({
  entry,
  onChange,
  onRemove,
}: {
  entry: CartEntry;
  onChange: (quantity: number) => void;
  onRemove: () => void;
}) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-transparent px-3 py-2 hover:border-zinc-200 dark:hover:border-zinc-700">
    <div>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {entry.menuItem.name}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        ${entry.menuItem.price.toFixed(2)} • {categoryLabels[entry.menuItem.category]}
      </p>
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(1, entry.quantity - 1))}
        className="rounded-full border border-zinc-200 p-1 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-6 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {entry.quantity}
      </span>
      <button
        onClick={() => onChange(entry.quantity + 1)}
        className="rounded-full border border-zinc-200 p-1 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        onClick={onRemove}
        className="text-sm text-zinc-400 hover:text-red-500 dark:hover:text-red-400"
      >
        Remove
      </button>
    </div>
  </div>
);

const OrderList = ({
  orders,
  onFire,
}: {
  orders: Order[];
  onFire: (orderId: string) => void;
}) => (
  <div className="space-y-3">
    {orders.length === 0 ? (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No active orders. Create one to get started.
      </p>
    ) : (
      orders.map((order) => (
        <div
          key={order.id}
          className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/70"
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              #{order.id.slice(0, 6).toUpperCase()} • {order.customerName ?? "Guest"}
            </p>
            <span
              className={clsx(
                "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                order.status === "pending" && "bg-amber-100 text-amber-700",
                order.status === "in-progress" && "bg-blue-100 text-blue-700",
                order.status === "ready" && "bg-emerald-100 text-emerald-700",
                order.status === "served" && "bg-purple-100 text-purple-700",
                order.status === "settled" && "bg-zinc-200 text-zinc-700",
                "dark:bg-opacity-20 dark:text-opacity-90"
              )}
            >
              {order.status.replace("-", " ")}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {order.items.map((item) => `${item.quantity}× ${item.menuItemId}`).join(", ")}
          </p>
          {order.status === "pending" && (
            <button
              onClick={() => onFire(order.id)}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
            >
              <Send className="h-4 w-4" />
              Fire to KOT
            </button>
          )}
        </div>
      ))
    )}
  </div>
);

export const PosTerminal = () => {
  const {
    menu,
    tables,
    waiters,
    orders,
    createOrder,
    fireOrderToKitchen,
  } = usePosStore();

  const [selectedWaiter, setSelectedWaiter] = useState<string>(waiters[0]?.id ?? "");
  const [selectedTable, setSelectedTable] = useState<string | undefined>(undefined);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartEntry[]>([]);

  const availableTables = useMemo(
    () => tables.filter((table) => table.status !== "occupied"),
    [tables]
  );

  const filteredMenu = useMemo(() => {
    const query = search.trim().toLowerCase();
    return menu.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      item.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [menu, search]);

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (sum, entry) => sum + entry.menuItem.price * entry.quantity,
        0
      ),
    [cart]
  );

  const groupByCategory = useMemo(() => {
    return filteredMenu.reduce<Record<MenuItem["category"], MenuItem[]>>(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      { coffee: [], tea: [], pastry: [], food: [], other: [] }
    );
  }, [filteredMenu]);

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status !== "settled").slice(0, 4),
    [orders]
  );

  const handleAddToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((entry) => entry.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((entry) =>
          entry.menuItem.id === menuItem.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const handleCheckout = () => {
    if (!selectedWaiter || cart.length === 0) return;
    const orderId = createOrder({
      waiterId: selectedWaiter,
      tableId: selectedTable,
      notes: note,
      items: cart.map((entry) => ({
        menuItemId: entry.menuItem.id,
        quantity: entry.quantity,
        note: entry.note,
      })),
    });

    const predominantCategory = cart.reduce<Record<MenuItem["category"], number>>(
      (acc, entry) => {
        acc[entry.menuItem.category] =
          (acc[entry.menuItem.category] ?? 0) + entry.quantity;
        return acc;
      },
      { coffee: 0, tea: 0, pastry: 0, food: 0, other: 0 }
    );
    const primaryCategory =
      Object.entries(predominantCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "food";

    fireOrderToKitchen(orderId, stationMap[primaryCategory as MenuItem["category"]]);

    setCart([]);
    setNote("");
    setSelectedTable(undefined);
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-2/3">
        <SectionCard
          title="Menu"
          description="Tap to add items to the order. Search by name or tag."
          className="max-h-[600px]"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search drinks, food, tags..."
                className="w-full rounded-full border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              />
            </div>
            <select
              value={selectedWaiter}
              onChange={(event) => setSelectedWaiter(event.target.value)}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {waiters.map((waiter) => (
                <option key={waiter.id} value={waiter.id}>
                  On duty: {waiter.name}
                </option>
              ))}
            </select>
            <select
              value={selectedTable ?? ""}
              onChange={(event) =>
                setSelectedTable(event.target.value || undefined)
              }
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Pickup / To-Go</option>
              {availableTables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.label} · {table.capacity} seats
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid max-h-[440px] grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(groupByCategory).map(([category, items]) =>
              items.length === 0 ? null : (
                <div key={category} className="space-y-3">
                  <h3 className="sticky top-0 z-10 flex items-center justify-between bg-white/90 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-400">
                    {categoryLabels[category as MenuItem["category"]]}
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                      {items.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {items.map((item) => (
                      <MenuCard
                        key={item.id}
                        item={item}
                        onAdd={() => handleAddToCart(item)}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </SectionCard>
      </div>

      <div className="flex w-full flex-col gap-4 lg:w-1/3">
        <SectionCard title="Order Summary" description="Review before sending to kitchen.">
          <div className="space-y-3">
            {cart.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Add items from the menu to build the ticket.
              </p>
            ) : (
              cart.map((entry) => (
                <CartRow
                  key={entry.menuItem.id}
                  entry={entry}
                  onChange={(quantity) =>
                    setCart((prev) =>
                      prev.map((item) =>
                        item.menuItem.id === entry.menuItem.id
                          ? { ...item, quantity }
                          : item
                      )
                    )
                  }
                  onRemove={() =>
                    setCart((prev) =>
                      prev.filter((item) => item.menuItem.id !== entry.menuItem.id)
                    )
                  }
                />
              ))
            )}
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add special instructions..."
            className="mt-4 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <div className="mt-4 flex items-center justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={clsx(
              "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
              cart.length === 0
                ? "cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            )}
          >
            <Send className="h-4 w-4" />
            Send to Kitchen
          </button>
        </SectionCard>

        <SectionCard title="Live Orders" description="Quick status of hottest tickets.">
          <OrderList
            orders={pendingOrders}
            onFire={(orderId) => fireOrderToKitchen(orderId, "kitchen")}
          />
        </SectionCard>
      </div>
    </div>
  );
};
