import { db, getTables } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import ItemCard from "@/components/ItemCard";
import type { Item } from "@/lib/schema";

export const dynamic = "force-dynamic";

async function getProgress(): Promise<Item[]> {
  const { items } = getTables();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (db as any)
    .select()
    .from(items)
    .where(eq(items.type, "progress"))
    .orderBy(desc(items.pinned), desc(items.createdAt));
}

export default async function ProgressPage() {
  let items: Item[] = [];
  let error = "";

  try {
    items = await getProgress();
  } catch (e) {
    error = "Could not load progress items.";
    console.error(e);
  }

  const active = items.filter((i) => i.status !== "archived");
  const done = active.filter((i) => i.status === "done");
  const inProgress = active.filter((i) => i.status === "active");
  const pending = active.filter((i) => i.status === "pending");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>📊</span> Progress
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Project progress updates and milestones.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {[
        { label: "In Progress", items: inProgress, color: "text-blue-600" },
        { label: "Pending", items: pending, color: "text-yellow-600" },
        { label: "Done", items: done, color: "text-green-600" },
      ].map(({ label, items: group, color }) =>
        group.length > 0 ? (
          <section key={label} className="mb-8">
            <h2 className={`text-sm font-semibold mb-3 ${color}`}>{label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null
      )}

      {active.length === 0 && !error && (
        <p className="text-center py-12 text-muted-foreground text-sm">
          No progress items.
        </p>
      )}
    </div>
  );
}
