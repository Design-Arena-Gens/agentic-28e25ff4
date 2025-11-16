"use client";

import { useMemo, useState } from "react";
import { usePosStore } from "@/store/pos-store";
import { InventoryItem, MenuItem, Recipe } from "@/lib/types";
import {
  CircleDollarSign,
  ClipboardCheck,
  Flame,
  Leaf,
  Minus,
  Plus,
  RefreshCw,
  Utensils,
} from "lucide-react";
import clsx from "clsx";

const formatMoney = (value: number) => `$${value.toFixed(2)}`;

const InventoryRow = ({
  item,
  onAdjust,
}: {
  item: InventoryItem;
  onAdjust: (nextQuantity: number) => void;
}) => {
  const isLow = item.quantity <= item.parLevel;
  return (
    <div
      className={clsx(
        "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm shadow-sm transition",
        isLow
          ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200"
          : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      )}
    >
      <div>
        <p className="font-semibold">{item.name}</p>
        <p className="text-xs opacity-70">
          On hand {item.quantity.toFixed(1)} {item.unit} · Par {item.parLevel} ·{" "}
          {formatMoney(item.costPerUnit)} / {item.unit}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onAdjust(Math.max(item.quantity - 1, 0))}
          className="rounded-full border border-zinc-200 p-1 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-10 text-center text-sm font-semibold">
          {item.quantity.toFixed(0)}
        </span>
        <button
          onClick={() => onAdjust(item.quantity + 1)}
          className="rounded-full border border-zinc-200 p-1 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const MenuRow = ({
  item,
  onToggle,
  onPriceChange,
  onSelect,
  selected,
}: {
  item: MenuItem;
  onToggle: () => void;
  onPriceChange: (price: number) => void;
  onSelect: () => void;
  selected: boolean;
}) => (
  <div
    className={clsx(
      "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50",
      "dark:hover:border-emerald-500/80 dark:hover:bg-emerald-950/20",
      selected
        ? "border-emerald-400 bg-emerald-50/80 dark:border-emerald-500/60 dark:bg-emerald-900/20"
        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    )}
    onClick={onSelect}
  >
    <div>
      <p className="font-semibold text-zinc-900 dark:text-zinc-50">{item.name}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {item.category} · {item.tags.slice(0, 3).join(", ")}
      </p>
    </div>
    <div className="flex items-center gap-3">
      <input
        type="number"
        step={0.1}
        min={0}
        value={item.price}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onPriceChange(Number(event.target.value))}
        className="w-20 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
      />
      <button
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className={clsx(
          "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
          item.isAvailable
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : "bg-zinc-200 text-zinc-500 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        )}
      >
        {item.isAvailable ? "Available" : "Offline"}
      </button>
    </div>
  </div>
);

const RecipeCard = ({
  recipe,
  inventoryLookup,
}: {
  recipe: Recipe;
  inventoryLookup: Record<string, InventoryItem>;
}) => (
  <div className="rounded-3xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
      <Utensils className="h-4 w-4 text-emerald-500" />
      Recipe card
    </div>
    <div className="mt-4 space-y-2 text-sm">
      <div>
        <h4 className="text-xs uppercase tracking-wide text-zinc-400">Ingredients</h4>
        <ul className="mt-1 space-y-1">
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient.inventoryItemId} className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                {inventoryLookup[ingredient.inventoryItemId]?.name ?? ingredient.inventoryItemId}
              </span>
              <span className="text-zinc-400">
                {ingredient.quantity} {ingredient.unit}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-wide text-zinc-400">Steps</h4>
        <ol className="mt-1 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {recipe.instructions.map((instruction, index) => (
            <li key={instruction}>
              <span className="font-semibold text-emerald-500">{index + 1}.</span>{" "}
              {instruction}
            </li>
          ))}
        </ol>
      </div>
    </div>
  </div>
);

export const InventoryManager = () => {
  const { inventory, menu, recipes, adjustInventory, updateMenuItem } = usePosStore();

  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(menu[0]?.id ?? null);

  const lowStock = useMemo(() => inventory.filter((item) => item.quantity <= item.parLevel), [inventory]);
  const averageCost = useMemo(
    () =>
      inventory.reduce((sum, item) => sum + item.costPerUnit * item.quantity, 0) /
      Math.max(inventory.length, 1),
    [inventory]
  );

  const selectedMenu = menu.find((item) => item.id === selectedMenuId) ?? null;
  const selectedRecipe = selectedMenu?.recipeId
    ? recipes.find((recipe) => recipe.id === selectedMenu.recipeId) ?? null
    : null;

  const inventoryLookup = useMemo(
    () =>
      inventory.reduce<Record<string, InventoryItem>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {}),
    [inventory]
  );

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-1/2">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-3xl border border-zinc-200 bg-white/80 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-900/70">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <Leaf className="h-4 w-4 text-emerald-500" />
              Stocked items
            </div>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {inventory.length}
            </p>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 px-4 py-4 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-70">
              <Flame className="h-4 w-4" />
              Low stock
            </div>
            <p className="mt-2 text-2xl font-semibold">{lowStock.length}</p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 px-4 py-4 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-70">
              <CircleDollarSign className="h-4 w-4" />
              Avg value
            </div>
            <p className="mt-2 text-2xl font-semibold">{formatMoney(averageCost)}</p>
          </div>
        </div>
        <div className="space-y-2">
          {inventory.map((item) => (
            <InventoryRow
              key={item.id}
              item={item}
              onAdjust={(nextQuantity) =>
                adjustInventory({ id: item.id, quantity: Number(nextQuantity.toFixed(2)) })
              }
            />
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 lg:w-1/2">
        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Menu availability
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Toggle items live on POS and adjust pricing on the fly.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500 transition hover:border-emerald-500 hover:text-emerald-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-200">
              <RefreshCw className="h-4 w-4" />
              Sync to displays
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {menu.map((item) => (
              <MenuRow
                key={item.id}
                item={item}
                selected={item.id === selectedMenuId}
                onSelect={() => setSelectedMenuId(item.id)}
                onToggle={() =>
                  updateMenuItem({
                    id: item.id,
                    isAvailable: !item.isAvailable,
                  })
                }
                onPriceChange={(price) =>
                  updateMenuItem({
                    id: item.id,
                    price: price > 0 ? price : 0,
                  })
                }
              />
            ))}
          </div>
        </div>

        {selectedMenu && selectedRecipe ? (
          <RecipeCard recipe={selectedRecipe} inventoryLookup={inventoryLookup} />
        ) : selectedMenu ? (
          <div className="rounded-3xl border border-zinc-200 bg-white/80 p-5 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
            <ClipboardCheck className="h-5 w-5 text-emerald-500" />
            <p className="mt-2">
              No recipe attached to <strong>{selectedMenu.name}</strong>. Attach one in Backoffice to track prep and cost.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

