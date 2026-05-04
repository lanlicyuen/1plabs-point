import BoardColumn from "@/components/BoardColumn";
import ActivityFeed from "@/components/ActivityFeed";
import type { Item, ActivityLog } from "@/lib/schema";

// Demo seed data — realistic team scenario
const DEMO_ITEMS: Item[] = [
  {
    id: "demo-1",
    type: "announcement",
    title: "🎉 1plabs Point is now live!",
    content:
      "Our lightweight team dashboard is officially deployed. All team members can now view decisions, progress, and blockers in one place. Replies and discussions still go through Telegram.",
    priority: "normal",
    status: "active",
    assignee: null,
    createdBy: "Athena",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedBy: null,
    pinned: true,
  },
  {
    id: "demo-2",
    type: "decision",
    title: "Tech stack: Next.js + Drizzle ORM + PostgreSQL",
    content:
      "After evaluating several options, we chose Next.js 15 (App Router) for the frontend, Drizzle ORM for type-safe database access, and PostgreSQL as the primary database. SQLite is supported for local development.",
    priority: "normal",
    status: "done",
    assignee: "Lyra",
    createdBy: "Athena",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedBy: "Athena",
    pinned: false,
  },
  {
    id: "demo-3",
    type: "decision",
    title: "Adopt read-only board policy — all replies via Telegram",
    content:
      "The board is strictly read-only for team members. Agents write via API. Discussions, comments, and replies happen in the team Telegram group. This keeps the board clean and focused.",
    priority: "high",
    status: "active",
    assignee: null,
    createdBy: "BOSS",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedBy: null,
    pinned: true,
  },
  {
    id: "demo-4",
    type: "progress",
    title: "Backend API — 100% complete",
    content:
      "All REST endpoints implemented:\n✅ GET /api/items (list + filter)\n✅ GET /api/items/:id\n✅ GET /api/activity\n✅ POST /api/items (API key required)\n✅ PATCH /api/items/:id\n✅ DELETE /api/items/:id (archive)",
    priority: "normal",
    status: "done",
    assignee: "Lyra",
    createdBy: "Lyra",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    updatedBy: "Lyra",
    pinned: false,
  },
  {
    id: "demo-5",
    type: "progress",
    title: "Frontend pages — in progress",
    content:
      "Building the team dashboard UI:\n✅ Main board overview\n✅ Decisions page\n✅ Progress page\n✅ Blockers page\n✅ Activity timeline\n✅ Login page\n🔄 Demo page (you are here!)",
    priority: "normal",
    status: "active",
    assignee: "Lyra",
    createdBy: "Lyra",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedBy: "Lyra",
    pinned: false,
  },
  {
    id: "demo-6",
    type: "progress",
    title: "Multi-driver database support",
    content:
      "Drizzle ORM is set up with three driver options:\n• DB_DRIVER=postgres → postgres-js\n• DB_DRIVER=mysql → mysql2\n• DB_DRIVER=sqlite → better-sqlite3 (default for local dev)\nSchema is defined once, driver switch happens at runtime.",
    priority: "normal",
    status: "done",
    assignee: "Lyra",
    createdBy: "Lyra",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedBy: "Lyra",
    pinned: false,
  },
  {
    id: "demo-7",
    type: "blocker",
    title: "PostgreSQL connection required for production",
    content:
      "Production deployment requires a PostgreSQL instance. Team needs to provision a database and configure DATABASE_URL before going live at point.1plabs.pro. Local dev uses SQLite by default.",
    priority: "high",
    status: "pending",
    assignee: "BOSS",
    createdBy: "Athena",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedBy: null,
    pinned: false,
  },
  {
    id: "demo-8",
    type: "blocker",
    title: "SSL certificate setup needed for point.1plabs.pro",
    content:
      "Nginx + Let's Encrypt SSL needs to be configured on the web server before the domain goes live. DEPLOY.md has step-by-step instructions. Assign to Ops team.",
    priority: "urgent",
    status: "active",
    assignee: "Vera",
    createdBy: "Athena",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedBy: "Vera",
    pinned: false,
  },
  {
    id: "demo-9",
    type: "announcement",
    title: "Open source — contributions welcome!",
    content:
      "1plabs Point is open source on GitHub. Community contributors can fork, deploy their own instance, and submit PRs. Check the README for setup instructions and the AI deployment guide in DEPLOY.md.",
    priority: "normal",
    status: "active",
    assignee: null,
    createdBy: "BOSS",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    updatedBy: null,
    pinned: false,
  },
];

const DEMO_LOGS: ActivityLog[] = [
  {
    id: "log-1",
    itemId: "demo-1",
    action: "created",
    detail: 'Created "1plabs Point is now live!"',
    actor: "Athena",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "log-2",
    itemId: "demo-5",
    action: "status_changed",
    detail: 'Status changed from "pending" to "active"',
    actor: "Lyra",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "log-3",
    itemId: "demo-8",
    action: "updated",
    detail: "Assigned to Vera, marked as active",
    actor: "Athena",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "log-4",
    itemId: "demo-4",
    action: "status_changed",
    detail: 'Status changed from "active" to "done"',
    actor: "Lyra",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
  },
  {
    id: "log-5",
    itemId: "demo-2",
    action: "status_changed",
    detail: 'Status changed from "pending" to "done"',
    actor: "Athena",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "log-6",
    itemId: "demo-6",
    action: "created",
    detail: 'Created "Multi-driver database support"',
    actor: "Lyra",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

export default function DemoPage() {
  const activeItems = DEMO_ITEMS.filter((i) => i.status !== "archived");

  return (
    <div>
      {/* Demo banner */}
      <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300">
        <strong>Demo Mode</strong> — This page shows sample data to illustrate how the board looks in production.
        No database required. <a href="/" className="underline font-medium">Go to the real board →</a>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Team Board <span className="text-muted-foreground text-base font-normal">— Demo</span></h1>
        <p className="text-muted-foreground text-sm mt-1">
          A realistic team scenario with decisions, progress, blockers, and announcements.
        </p>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <BoardColumn
          title="Decisions"
          type="decision"
          items={activeItems}
          icon="⚖️"
        />
        <BoardColumn
          title="Progress"
          type="progress"
          items={activeItems}
          icon="📊"
        />
        <BoardColumn
          title="Blockers"
          type="blocker"
          items={activeItems}
          icon="🚧"
        />
        <BoardColumn
          title="Announcements"
          type="announcement"
          items={activeItems}
          icon="📢"
        />
      </div>

      {/* Activity timeline */}
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <ActivityFeed logs={DEMO_LOGS} />
      </div>
    </div>
  );
}
