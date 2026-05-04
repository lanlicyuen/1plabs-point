import ItemCard from "./ItemCard";
import type { Item, ItemType } from "@/lib/schema";

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
};

export default function BoardColumn({ title, type, items, icon }: BoardColumnProps) {
  const activeItems = items.filter((i) => i.status !== "archived" && i.status !== "deleted");

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
          {activeItems.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {activeItems.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No items</p>
        ) : (
          activeItems.map((item) => <ItemCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}