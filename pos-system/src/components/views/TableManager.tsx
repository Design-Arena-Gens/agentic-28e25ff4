"use client";

import { useMemo, useState } from "react";
import { usePosStore } from "@/store/pos-store";
import { TableStatus } from "@/lib/types";
import { ChevronRight, Clock, Users } from "lucide-react";
import clsx from "clsx";

const statusMeta: Record<
  TableStatus,
  { label: string; badge: string; indicator: string }
> = {
  available: {
    label: "Available",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    indicator: "bg-emerald-500",
  },
  occupied: {
    label: "Occupied",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
    indicator: "bg-blue-500",
  },
  reserved: {
    label: "Reserved",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    indicator: "bg-amber-500",
  },
  dirty: {
    label: "Needs Clean",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    indicator: "bg-rose-500",
  },
};

const TableCard = ({
  id,
  label,
  capacity,
  status,
  activeOrderId,
  people,
  onSelect,
}: {
  id: string;
  label: string;
  capacity: number;
  status: TableStatus;
  activeOrderId?: string;
  people?: number;
  onSelect: (tableId: string) => void;
}) => (
  <button
    onClick={() => onSelect(id)}
    className={clsx(
      "group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
      "dark:border-zinc-800 dark:bg-zinc-950",
      status === "occupied" && "ring-2 ring-blue-200 dark:ring-blue-900/40"
    )}
  >
    <div className="flex items-start justify-between">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </span>
        <h3 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {statusMeta[status].label}
        </h3>
      </div>
      <span
        className={clsx(
          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
          statusMeta[status].badge
        )}
      >
        {capacity} seats
      </span>
    </div>
    <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
      <span className="inline-flex items-center gap-1">
        <Users className="h-3.5 w-3.5" />
        {people ? `${people} guest${people > 1 ? "s" : ""}` : "Empty"}
      </span>
      {activeOrderId ? (
        <span className="inline-flex items-center gap-1 text-emerald-500">
          Ticket {activeOrderId.slice(0, 6).toUpperCase()}
          <ChevronRight className="h-3 w-3" />
        </span>
      ) : (
        <span>Ready to seat</span>
      )}
    </div>
    <span
      className={clsx(
        "mt-4 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800",
        "overflow-hidden"
      )}
    >
      <span className={clsx("block h-full rounded-full", statusMeta[status].indicator)} />
    </span>
  </button>
);

export const TableManager = () => {
  const { tables, orders, updateTableStatus } = usePosStore();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId),
    [selectedTableId, tables]
  );

  const activeOrder = useMemo(() => {
    if (!selectedTable?.activeOrderId) return undefined;
    return orders.find((order) => order.id === selectedTable.activeOrderId);
  }, [selectedTable, orders]);

  const stats = useMemo(() => {
    const total = tables.length;
    const occupied = tables.filter((table) => table.status === "occupied").length;
    const available = tables.filter((table) => table.status === "available").length;
    const reserved = tables.filter((table) => table.status === "reserved").length;
    const dirty = tables.filter((table) => table.status === "dirty").length;
    return { total, occupied, available, reserved, dirty };
  }, [tables]);

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-2/3">
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/70">
            <p className="text-xs text-zinc-500">Total Tables</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats.total}
            </p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
            <p className="text-xs opacity-80">Occupied</p>
            <p className="mt-1 text-2xl font-semibold">{stats.occupied}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
            <p className="text-xs opacity-80">Available</p>
            <p className="mt-1 text-2xl font-semibold">{stats.available}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
            <p className="text-xs opacity-80">Reserved / Dirty</p>
            <p className="mt-1 text-2xl font-semibold">
              {stats.reserved + stats.dirty}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              id={table.id}
              label={table.label}
              capacity={table.capacity}
              status={table.status}
              activeOrderId={table.activeOrderId}
              people={
                table.activeOrderId
                  ? orders
                      .find((order) => order.id === table.activeOrderId)
                      ?.items.reduce((qty, item) => qty + item.quantity, 0)
                  : undefined
              }
              onSelect={(id) => setSelectedTableId((prev) => (prev === id ? null : id))}
            />
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 lg:w-1/3">
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Selected Table
              </p>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {selectedTable?.label ?? "None"}
              </h3>
            </div>
            {selectedTable ? (
              <select
                value={selectedTable.status}
                onChange={(event) =>
                  updateTableStatus({
                    id: selectedTable.id,
                    status: event.target.value as TableStatus,
                  })
                }
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {Object.keys(statusMeta).map((status) => (
                  <option key={status} value={status}>
                    {statusMeta[status as TableStatus].label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          {selectedTable && activeOrder ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-200">
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  Order #{activeOrder.id.slice(0, 6).toUpperCase()}
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs text-emerald-500 dark:bg-emerald-900/60 dark:text-emerald-100">
                  <Clock className="h-3 w-3" />
                  {new Date(activeOrder.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-xs">
                {activeOrder.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span className="font-medium text-emerald-900 dark:text-emerald-100">
                      {item.quantity}× {item.menuItemId}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                <span>Total Due</span>
                <span>
                  $
                  {activeOrder.items
                    .reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Select a table to see live status and update seating state.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

