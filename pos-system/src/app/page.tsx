"use client";

import { useMemo, useState } from "react";
import { usePosStore } from "@/store/pos-store";
import { PosTerminal } from "@/components/views/PosTerminal";
import { TableManager } from "@/components/views/TableManager";
import { KitchenDisplay } from "@/components/views/KitchenDisplay";
import { WaiterConsole } from "@/components/views/WaiterConsole";
import { InventoryManager } from "@/components/views/InventoryManager";
import {
  BadgeCheck,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Salad,
  TabletSmartphone,
} from "lucide-react";
import clsx from "clsx";

type ViewKey = "terminal" | "tables" | "kitchen" | "waiter" | "inventory";

const viewConfig: Record<
  ViewKey,
  {
    name: string;
    description: string;
    icon: React.ReactNode;
  }
> = {
  terminal: {
    name: "POS Terminal",
    description: "Touch-optimised ordering with live totals.",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  tables: {
    name: "Floor Control",
    description: "Real-time seating, occupancy and status changes.",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  kitchen: {
    name: "KOT Display",
    description: "Ticket queue with timers and completion workflow.",
    icon: <ChefHat className="h-4 w-4" />,
  },
  waiter: {
    name: "Waiter Mode",
    description: "Pocket-friendly quick order punching.",
    icon: <TabletSmartphone className="h-4 w-4" />,
  },
  inventory: {
    name: "Menu & Inventory",
    description: "One-click stock, pricing and recipe cards.",
    icon: <Salad className="h-4 w-4" />,
  },
};

const MetricCard = ({
  title,
  value,
  trend,
  icon,
}: {
  title: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 rounded-3xl border border-white/60 bg-white/80 px-5 py-4 text-sm shadow-sm backdrop-blur-lg dark:border-zinc-800/60 dark:bg-zinc-900/60">
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
      {icon}
    </span>
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {title}
      </p>
      <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
      {trend ? (
        <p className="text-xs text-emerald-500 dark:text-emerald-300">{trend}</p>
      ) : null}
    </div>
  </div>
);

const ViewSwitcher = ({
  active,
  onChange,
}: {
  active: ViewKey;
  onChange: (view: ViewKey) => void;
}) => (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
    {(Object.keys(viewConfig) as ViewKey[]).map((view) => {
      const config = viewConfig[view];
      return (
        <button
          key={view}
          onClick={() => onChange(view)}
          className={clsx(
            "flex h-full flex-col rounded-3xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500/60",
            active === view
              ? "border-transparent bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-lg"
              : "border-white/70 bg-white/70 shadow-sm hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg dark:border-zinc-800/60 dark:bg-zinc-900/60"
          )}
        >
          <span
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-2xl",
              active === view
                ? "bg-white/20 text-white"
                : "bg-emerald-500/15 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300"
            )}
          >
            {config.icon}
          </span>
          <span
            className={clsx(
              "mt-3 text-sm font-semibold",
              active === view ? "text-white" : "text-zinc-900 dark:text-zinc-100"
            )}
          >
            {config.name}
          </span>
          <span
            className={clsx(
              "mt-1 text-xs",
              active === view ? "text-white/80" : "text-zinc-500 dark:text-zinc-400"
            )}
          >
            {config.description}
          </span>
        </button>
      );
    })}
  </div>
);

export default function Home() {
  const [view, setView] = useState<ViewKey>("terminal");
  const { orders, tables, kotTickets, inventory } = usePosStore();

  const metrics = useMemo(() => {
    const todays = orders.filter(
      (order) => new Date(order.createdAt).toDateString() === new Date().toDateString()
    );
    const revenue = todays.reduce(
      (sum, order) => sum + order.items.reduce((total, item) => total + item.price * item.quantity, 0),
      0
    );
    const openTables = tables.filter((table) => table.status === "occupied").length;
    const pendingTickets = kotTickets.filter((ticket) => ticket.status !== "completed").length;
    const stockAlerts = inventory.filter((item) => item.quantity <= item.parLevel).length;
    return {
      revenue: `$${revenue.toFixed(2)}`,
      averageTicket:
        todays.length > 0 ? `$${(revenue / todays.length).toFixed(2)}` : "$0.00",
      openTables: `${openTables}/${tables.length}`,
      pendingTickets: `${pendingTickets} live`,
      stockAlerts: `${stockAlerts} low`,
    };
  }, [inventory, kotTickets, orders, tables]);

  return (
    <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/80 bg-white/60 px-6 py-6 shadow-xl backdrop-blur-2xl dark:border-zinc-800/60 dark:bg-zinc-900/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-500">
            Pulse Café Command
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Unified POS & Backoffice
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            Seamless operations across the floor, order stations and kitchen. Designed for quick service cafés needing trustworthy live data.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-emerald-500/10 px-4 py-2 text-xs text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
          <BadgeCheck className="h-4 w-4" />
          Synced {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Today's revenue"
          value={metrics.revenue}
          trend="+12% vs yesterday"
          icon={<ListChecks className="h-4 w-4" />}
        />
        <MetricCard
          title="Avg ticket"
          value={metrics.averageTicket}
          trend="Based on settled orders"
          icon={<LayoutDashboard className="h-4 w-4" />}
        />
        <MetricCard
          title="Open tables"
          value={metrics.openTables}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <MetricCard
          title="KOT queue"
          value={metrics.pendingTickets}
          icon={<ChefHat className="h-4 w-4" />}
        />
        <MetricCard
          title="Stock alerts"
          value={metrics.stockAlerts}
          icon={<Salad className="h-4 w-4" />}
        />
      </div>

      <ViewSwitcher active={view} onChange={setView} />

      <section className="rounded-3xl border border-white/80 bg-white/70 px-5 py-6 shadow-xl backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/70">
        {view === "terminal" && <PosTerminal />}
        {view === "tables" && <TableManager />}
        {view === "kitchen" && <KitchenDisplay />}
        {view === "waiter" && <WaiterConsole />}
        {view === "inventory" && <InventoryManager />}
      </section>
    </main>
  );
}
