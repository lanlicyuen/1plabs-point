"use client";

import { useState } from "react";
import ItemCard from "./ItemCard";
import type { Item, ItemType } from "@/lib/schema";

const COMPLETED_STATUSES = ["done", "completed", "archived", "closed", "resolved"] as const;

function isCompletedStatus(status: string): boolean {
  return (COMPLETED_STATUSES as readonly string[]).includes(status);
}

interface BoardColumnProps {
  title: string;
  type: ItemType;
  items: Item[];
  icon?: string;
}

const columnColors: Record<ItemType, string> = {
  task: "border-t-amber-500",
  decision: "border-t-purple-500",
  progress: "border-t-blue-500",
  blocker: "border-t-red-500",
  announcement: "border-t-green-500",
  upgrade: "border-t-cyan-500",
  deploy: "border-t-emerald-500",
  incident: "border-t-rose-500",
};

export default function BoardColumn({ title, type, items, icon }: BoardColumnProps) {
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const filteredItems = items.filter(
    (i) => i.status !== "archived" && i.status !== "deleted"
  );

  const activeItems = filteredItems.filter((i) => !isCompletedStatus(i.status));
  const completedItems = filteredItems.filter((i) => isCompletedStatus(i.status));

  return (
    <div className={`flex flex-col gap-3 min-w-0`}>
      {/* Column header */}
      <div
        className={`rounded-lg border-t-4 ${columnColors[type]} bg-muted/40 px-3 py-2 flex items-center justify-between`}
      >
        <h2 className="font-semibold text-sm flex items-center gap-1.5">
          {icon && <span>{icon}</span>}
          {title}
        </h2>
        <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5 border">
          {filteredItems.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {/* Active items */}
        {activeItems.length === 0 && completedItems.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No items</p>
        ) : (
          activeItems.map((item) => <ItemCard key={item.id} item={item} />)
        )}

        {/* Collapsible completed section */}
        {completedItems.length > 0 && (
          <>
            <button
              onClick={() => setCompletedExpanded((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 py-1 px-1 -mx-1 rounded cursor-pointer select-none group"
            >
              <span
                className={`inline-block transition-transform duration-200 ${
                  completedExpanded ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
              <span>
                Completed ({completedItems.length})
              </span>
            </button>

            {/* Collapsible container using grid rows animation */}
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                completedExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-2">
                  {completedItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}