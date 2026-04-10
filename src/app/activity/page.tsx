import { db, getTables } from "@/lib/db";
import { desc } from "drizzle-orm";
import ActivityFeed from "@/components/ActivityFeed";
import type { ActivityLog } from "@/lib/schema";

export const dynamic = "force-dynamic";

async function getLogs(): Promise<ActivityLog[]> {
  const { activityLog } = getTables();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (db as any)
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(100);
}

export default async function ActivityPage() {
  let logs: ActivityLog[] = [];
  let error = "";

  try {
    logs = await getLogs();
  } catch (e) {
    error = "Could not load activity log.";
    console.error(e);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>📋</span> Activity
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Recent changes and updates to board items.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="max-w-2xl">
        <ActivityFeed logs={logs} />
      </div>
    </div>
  );
}
