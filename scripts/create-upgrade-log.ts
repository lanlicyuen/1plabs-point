type TimelineType = "progress" | "upgrade" | "deploy" | "incident" | "decision";
type ItemStatus = "pending" | "active" | "done" | "archived";
type ItemPriority = "urgent" | "high" | "normal" | "low";

type Options = {
  title: string;
  type: TimelineType;
  changes: string;
  fixes: string;
  impact: string;
  risk: string;
  commit: string;
  deployed: string;
  status: ItemStatus;
  priority: ItemPriority;
  assignee: string | null;
  pinned: boolean;
};

const DEFAULT_API_BASE_URL = "http://localhost:3002/api";

function parseDotEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsAt = line.indexOf("=");
    if (equalsAt === -1) continue;

    const key = line.slice(0, equalsAt).trim();
    let value = line.slice(equalsAt + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

async function loadEnv() {
  const { readFile } = await import("node:fs/promises");

  try {
    const parsed = parseDotEnv(await readFile(".env", "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      process.env[key] ??= value;
    }
  } catch {
    // .env is optional; CI or shell env can provide all required values.
  }
}

function readFlag(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1) return process.argv[index + 1];

  return undefined;
}

function readBooleanFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentCommit(): string {
  try {
    const { execFileSync } = require("node:child_process") as typeof import("node:child_process");
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

function requireToken(): string {
  const token =
    process.env.POINT_AGENT_API_KEY ??
    process.env.AGENT_API_KEY_SYSTEM ??
    process.env.AGENT_API_KEY_XIAO_BLUE ??
    process.env.AGENT_API_KEY;

  if (!token) {
    throw new Error(
      "Missing API token. Set POINT_AGENT_API_KEY, AGENT_API_KEY_SYSTEM, AGENT_API_KEY_XIAO_BLUE, or AGENT_API_KEY."
    );
  }

  return token;
}

function buildOptions(): Options {
  const shortTitle = readFlag("title") ?? "System upgrade";
  const deployed = readFlag("deployed") ?? "dev only / not deployed";

  return {
    title: `[Point Upgrade] ${today()} ${shortTitle}`,
    type: (readFlag("type") as TimelineType | undefined) ?? "upgrade",
    changes: readFlag("changes") ?? "Not specified",
    fixes: readFlag("fixes") ?? "Not specified",
    impact: readFlag("impact") ?? "Point system timeline / upgrade log workflow",
    risk: readFlag("risk") ?? "Low; records are written through the existing Point API",
    commit: readFlag("commit") ?? currentCommit(),
    deployed,
    status: (readFlag("status") as ItemStatus | undefined) ?? (deployed === "deployed" ? "done" : "pending"),
    priority: (readFlag("priority") as ItemPriority | undefined) ?? "normal",
    assignee: readFlag("assignee") ?? null,
    pinned: readBooleanFlag("pinned"),
  };
}

function buildContent(options: Options): string {
  return [
    "project: Point",
    "role: system",
    "agent_name: system/xiao_blue",
    "",
    `修改内容：${options.changes}`,
    `修复内容：${options.fixes}`,
    `影响范围：${options.impact}`,
    `风险：${options.risk}`,
    `commit：${options.commit}`,
    `部署状态：${options.deployed}`,
  ].join("\n");
}

async function main() {
  await loadEnv();

  const token = requireToken();
  const apiBaseUrl = process.env.POINT_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const options = buildOptions();
  const payload = {
    type: options.type,
    title: options.title,
    content: buildContent(options),
    priority: options.priority,
    status: options.status,
    assignee: options.assignee,
    pinned: options.pinned,
  };

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Point API returned ${response.status}: ${text}`);
  }

  const result = text ? JSON.parse(text) : {};
  console.log(JSON.stringify({ ok: true, apiBaseUrl, item: result.data ?? result }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
