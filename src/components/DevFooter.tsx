const workspaceVersion = process.env.NEXT_PUBLIC_POINT_WORKSPACE_VERSION ?? "v0.2.0";
const decisionsVersion =
  process.env.NEXT_PUBLIC_POINT_DECISIONS_VERSION ?? "Decisions v2";
const commit = process.env.NEXT_PUBLIC_POINT_COMMIT ?? "unknown";
const buildTime = process.env.NEXT_PUBLIC_POINT_BUILD_TIME ?? "unknown";
const mode = process.env.NEXT_PUBLIC_POINT_APP_MODE ?? "DEV";

export default function DevFooter() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/75 px-3 py-1.5 text-[11px] leading-tight text-muted-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex max-w-7xl flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="truncate">
          1plabs Workspace {mode} • {workspaceVersion} • {commit}
        </div>
        <div className="truncate">
          Version: {decisionsVersion} • Built: {buildTime} • Mode: {mode}
        </div>
      </div>
    </footer>
  );
}
