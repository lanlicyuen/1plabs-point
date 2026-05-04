import { db, getTables } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import ItemCard from "@/components/ItemCard";
import type { Item } from "@/lib/schema";

export const dynamic = "force-dynamic";

async function getBlockers(): Promise<Item[]> {
  const { items } = getTables();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (db as any)
    .select()
    .from(items)
    .where(eq(items.type, "blocker"))
    .orderBy(desc(items.pinned), desc(items.createdAt));
}

export default async function BlockersPage() {
  let items: Item[] = [];
  let error = "";

  try {
    items = await getBlockers();
  } catch (e) {
    error = "Could not load blockers.";
    console.error(e);
  }

  const visible = items.filter((i) => i.status !== "deleted");
  const active = visible.filter((i) => i.status !== "archived" && i.status !== "done");
  const resolved = visible.filter((i) => i.status === "done");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🚧</span> Blockers
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Risks and blockers that need attention.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Active Blockers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {resolved.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Resolved ({resolved.length})
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {resolved.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </details>
      )}

      {active.length === 0 && resolved.length === 0 && !error && (
        <p className="text-center py-12 text-muted-foreground text-sm">
          No blockers. Keep it up! 🎉
        </p>
      )}
    </div>
  );
}
