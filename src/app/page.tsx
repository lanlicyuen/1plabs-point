import { db, getTables } from "@/lib/db";
import { and, desc, ne } from "drizzle-orm";
import BoardColumn from "@/components/BoardColumn";
import BoardIntro from "@/components/BoardIntro";
import type { Item } from "@/lib/schema";

export const dynamic = "force-dynamic";

async function getItems(): Promise<Item[]> {
  const { items } = getTables();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (db as any)
    .select()
    .from(items)
    .where(and(ne(items.status, "archived"), ne(items.status, "deleted")))
    .orderBy(desc(items.pinned), desc(items.createdAt));
}

export default async function HomePage() {
  let items: Item[] = [];
  let error = "";

  try {
    items = await getItems();
  } catch (e) {
    error = "Could not load items. Please ensure the database is configured.";
    console.error(e);
  }

  const byType = {
    task: items.filter((i) => i.type === "task"),
    upgrade: items.filter((i) => i.type === "upgrade"),
    deploy: items.filter((i) => i.type === "deploy"),
    incident: items.filter((i) => i.type === "incident"),
    decision: items.filter((i) => i.type === "decision"),
    progress: items.filter((i) => i.type === "progress"),
    blocker: items.filter((i) => i.type === "blocker"),
    announcement: items.filter((i) => i.type === "announcement"),
  };

  return (
    <div>
      <BoardIntro />

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <BoardColumn type="task" items={byType.task} icon="✅" />
        <BoardColumn type="upgrade" items={byType.upgrade} icon="📦" />
        <BoardColumn type="deploy" items={byType.deploy} icon="🚀" />
        <BoardColumn type="incident" items={byType.incident} icon="⚠️" />
        <BoardColumn type="decision" items={byType.decision} icon="🧠" />
        <BoardColumn type="progress" items={byType.progress} icon="📊" />
        <BoardColumn type="blocker" items={byType.blocker} icon="🚧" />
        <BoardColumn type="announcement" items={byType.announcement} icon="📢" />
      </div>
    </div>
  );
}
