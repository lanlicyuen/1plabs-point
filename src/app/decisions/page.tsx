import { db, getTables } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import ItemCard from "@/components/ItemCard";
import type { Item } from "@/lib/schema";

export const dynamic = "force-dynamic";

async function getDecisions(): Promise<Item[]> {
  const { items } = getTables();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (db as any)
    .select()
    .from(items)
    .where(eq(items.type, "decision"))
    .orderBy(desc(items.pinned), desc(items.createdAt));
}

export default async function DecisionsPage() {
  let items: Item[] = [];
  let error = "";

  try {
    items = await getDecisions();
  } catch (e) {
    error = "Could not load decisions.";
    console.error(e);
  }

  const visible = items.filter((i) => i.status !== "deleted");
  const active = visible.filter((i) => i.status !== "archived");
  const archived = visible.filter((i) => i.status === "archived");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>⚖️</span> Decisions
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Key decisions and their current status.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {active.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
        {active.length === 0 && !error && (
          <p className="col-span-full text-center py-12 text-muted-foreground text-sm">
            No active decisions.
          </p>
        )}
      </div>

      {archived.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Archived ({archived.length})
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {archived.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
