"use client";

import { useEffect, useMemo, useState } from "react";
import { usePosStore } from "@/store/pos-store";
import { KotEvent, Order } from "@/lib/types";
import {
  AlarmClock,
  BellRing,
  CheckCircle2,
  ChefHat,
  Flame,
  Timer,
} from "lucide-react";
import clsx from "clsx";

const statusColors: Record<KotEvent["status"], string> = {
  new: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-200",
  "in-progress":
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-900/30 dark:text-sky-200",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-200",
};

const stationTags: Record<KotEvent["station"], string> = {
  kitchen: "Kitchen",
  bar: "Bar",
  pastry: "Pastry",
};

const OrderBadge = ({ status }: { status: Order["status"] }) => {
  const styles: Record<Order["status"], string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
    "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
    ready: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
    served: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200",
    settled: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };
  return (
    <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold", styles[status])}>
      {status.replace("-", " ")}
    </span>
  );
};

export const KitchenDisplay = () => {
  const { kotTickets, orders, updateOrderStatus, dispatch } = usePosStore();
  const [selectedStation, setSelectedStation] = useState<KotEvent["station"] | "all">("all");

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const tickets = useMemo(() => {
    const filtered =
      selectedStation === "all"
        ? kotTickets
        : kotTickets.filter((ticket) => ticket.station === selectedStation);
    return filtered
      .map((ticket) => ({
        ticket,
        order: orders.find((order) => order.id === ticket.orderId),
      }))
      .filter((payload): payload is { ticket: KotEvent; order: Order } => Boolean(payload.order))
      .sort((a, b) => new Date(a.ticket.firedAt).getTime() - new Date(b.ticket.firedAt).getTime());
  }, [kotTickets, orders, selectedStation]);

  const moveTicket = (ticket: KotEvent, status: KotEvent["status"]) => {
    dispatch({ type: "UPSERT_KOT", payload: { ...ticket, status } });
    if (status === "completed") {
      updateOrderStatus(ticket.orderId, "ready");
    } else if (status === "in-progress") {
      updateOrderStatus(ticket.orderId, "in-progress");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedStation("all")}
          className={clsx(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
            selectedStation === "all"
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-zinc-200 text-zinc-600 hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
          )}
        >
          <BellRing className="h-4 w-4" />
          All Stations
        </button>
        {(["kitchen", "bar", "pastry"] as const).map((station) => (
          <button
            key={station}
            onClick={() => setSelectedStation(station)}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold capitalize transition",
              selectedStation === station
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-zinc-200 text-zinc-600 hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-emerald-400 dark:hover:text-emerald-200"
            )}
          >
            <ChefHat className="h-4 w-4" />
            {stationTags[station]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tickets.length === 0 ? (
          <div className="col-span-full flex flex-col items-center rounded-3xl border border-dashed border-emerald-300 bg-white/60 p-10 text-center text-emerald-500 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">
            <CheckCircle2 className="h-10 w-10" />
            <p className="mt-2 text-sm font-semibold">Kitchen is caught up!</p>
            <p className="text-xs opacity-70">
              No pending tickets. Fresh orders will appear the moment they are fired.
            </p>
          </div>
        ) : (
          tickets.map(({ ticket, order }) => {
            const waitingMinutes = Math.floor(
              (now - new Date(ticket.firedAt).getTime()) / 60000
            );
            return (
              <article
                key={ticket.id}
                className={clsx(
                  "flex h-full flex-col gap-3 rounded-3xl border bg-white/80 p-4 text-sm shadow-sm transition",
                  statusColors[ticket.status]
                )}
              >
                <header className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide opacity-70">
                      #{order.id.slice(0, 6).toUpperCase()}
                    </p>
                    <h3 className="text-lg font-semibold">{order.customerName ?? "Guest"}</h3>
                  </div>
                  <OrderBadge status={order.status} />
                </header>
                <div className="space-y-1 text-xs">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="font-semibold">
                        {item.quantity}× {item.menuItemId}
                      </span>
                      <span>${(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <footer className="mt-auto flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <AlarmClock className="h-3.5 w-3.5" />
                      {waitingMinutes} min
                    </span>
                    <span className="opacity-80">
                      {new Date(ticket.firedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ticket.status !== "completed" && (
                      <button
                        onClick={() => moveTicket(ticket, "completed")}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Ready
                      </button>
                    )}
                    {ticket.status === "new" && (
                      <button
                        onClick={() => moveTicket(ticket, "in-progress")}
                        className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-sky-600"
                      >
                        <Flame className="h-4 w-4" />
                        Start
                      </button>
                    )}
                    {ticket.status === "in-progress" && (
                      <button
                        onClick={() => moveTicket(ticket, "completed")}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/10"
                      >
                        <Timer className="h-4 w-4" />
                        Complete
                      </button>
                    )}
                  </div>
                </footer>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

