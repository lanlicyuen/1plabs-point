"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Clipboard,
  FileDown,
  Folder,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DecisionStatus = "pending" | "accepted";

type DecisionItem = {
  id: string;
  text: string;
  status: DecisionStatus;
};

type SavedSession = {
  id: string;
  projectTitle: string;
  sessionTitle: string;
  rawInput: string;
  exportedMarkdown: string;
  decisions: DecisionItem[];
  createdAt: string;
};

const STORAGE_KEY = "point-decisions-v2-sessions";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseDecisionItems(input: string): DecisionItem[] {
  const items: DecisionItem[] = [];

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line === "---" || line.startsWith(">")) {
      continue;
    }

    const checkbox = line.match(/^[-*]\s+\[([xX ])\]\s+(.+)$/);
    if (checkbox) {
      items.push({
        id: createId(),
        text: checkbox[2].trim(),
        status: checkbox[1].toLowerCase() === "x" ? "accepted" : "pending",
      });
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      items.push({ id: createId(), text: bullet[1].trim(), status: "pending" });
      continue;
    }

    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      items.push({ id: createId(), text: numbered[1].trim(), status: "pending" });
    }
  }

  return items.filter((item) => item.text.length > 0);
}

function buildMarkdown(projectTitle: string, sessionTitle: string, decisions: DecisionItem[]) {
  const lines = [
    `# ${projectTitle || "Untitled Project"}`,
    "",
    `## ${sessionTitle || "Untitled Session"}`,
    "",
    "| Status | Decision |",
    "| --- | --- |",
    ...decisions.map((item) => {
      const label = item.status === "accepted" ? "Accepted" : "Pending";
      return `| ${label} | ${item.text.replace(/\|/g, "\\|")} |`;
    }),
  ];

  return lines.join("\n");
}

function loadSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function DecisionsWorkspace() {
  const searchParams = useSearchParams();
  const [projectTitle, setProjectTitle] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSessions(loadSessions());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get("session");
    if (!sessionId || sessions.length === 0 || activeSessionId === sessionId) return;

    const session = sessions.find((item) => item.id === sessionId);
    if (session) {
      restoreSession(session);
    }
  }, [activeSessionId, searchParams, sessions]);

  const exportedMarkdown = useMemo(
    () => buildMarkdown(projectTitle, sessionTitle, decisions),
    [projectTitle, sessionTitle, decisions]
  );

  const groupedSessions = useMemo(() => {
    return sessions.reduce<Record<string, SavedSession[]>>((groups, session) => {
      const title = session.projectTitle || "Untitled Project";
      groups[title] = groups[title] ? [...groups[title], session] : [session];
      return groups;
    }, {});
  }, [sessions]);

  const canSave =
    projectTitle.trim().length > 0 &&
    sessionTitle.trim().length > 0 &&
    decisions.length > 0;

  function persistSessions(nextSessions: SavedSession[]) {
    setSessions(nextSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
  }

  function handleParse() {
    setDecisions(parseDecisionItems(rawInput));
    setSaveMessage("");
  }

  async function syncBoardCard(session: SavedSession) {
    const response = await fetch("/api/decision-session-board-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decisionSessionId: session.id,
        projectTitle: session.projectTitle,
        sessionTitle: session.sessionTitle,
        decisionCount: session.decisions.length,
      }),
    });

    if (!response.ok) {
      throw new Error("Could not sync Board card.");
    }
  }

  async function handleSave() {
    if (!canSave) {
      setSaveMessage("Project title, session title, and decisions are required.");
      return;
    }

    const saved: SavedSession = {
      id: activeSessionId ?? createId(),
      projectTitle: projectTitle.trim(),
      sessionTitle: sessionTitle.trim(),
      rawInput,
      exportedMarkdown,
      decisions,
      createdAt: new Date().toISOString(),
    };

    const exists = sessions.some((session) => session.id === saved.id);
    const nextSessions = exists
      ? sessions.map((session) => (session.id === saved.id ? saved : session))
      : [saved, ...sessions];

    persistSessions(nextSessions);
    setActiveSessionId(saved.id);
    try {
      await syncBoardCard(saved);
      setSaveMessage("Session saved and Board card synced.");
    } catch {
      setSaveMessage("Session saved locally. Board card sync failed.");
    }
  }

  function restoreSession(session: SavedSession) {
    setActiveSessionId(session.id);
    setProjectTitle(session.projectTitle);
    setSessionTitle(session.sessionTitle);
    setRawInput(session.rawInput);
    setDecisions(session.decisions);
    setSaveMessage("");
    setExportOpen(false);
  }

  function resetWorkspace() {
    setActiveSessionId(null);
    setProjectTitle("");
    setSessionTitle("");
    setRawInput("");
    setDecisions([]);
    setSaveMessage("");
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(exportedMarkdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function updateDecision(id: string, patch: Partial<DecisionItem>) {
    setDecisions((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
    setSaveMessage("");
  }

  function removeDecision(id: string) {
    setDecisions((items) => items.filter((item) => item.id !== id));
    setSaveMessage("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">History</h2>
          <Button variant="ghost" size="icon-sm" onClick={resetWorkspace} aria-label="New session">
            <RotateCcw />
          </Button>
        </div>

        {Object.keys(groupedSessions).length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved sessions.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSessions).map(([title, projectSessions]) => (
              <div key={title}>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Folder className="size-4 text-muted-foreground" />
                  <span className="truncate">{title}</span>
                </div>
                <div className="space-y-1 pl-6">
                  {projectSessions.map((session) => (
                    <button
                      key={session.id}
                      className={`block w-full truncate rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                        activeSessionId === session.id ? "bg-muted text-foreground" : "text-muted-foreground"
                      }`}
                      onClick={() => restoreSession(session)}
                      type="button"
                    >
                      {session.sessionTitle}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      <div className="min-w-0">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <span>⚖️</span> Decisions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Project decision workspace for parsing, saving, and exporting sessions.
          </p>
        </div>

        <div className="grid gap-4">
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                Project Title
                <Input
                  required
                  value={projectTitle}
                  onChange={(event) => setProjectTitle(event.target.value)}
                  placeholder="例如：时间管理策划"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Session Title
                <Input
                  required
                  value={sessionTitle}
                  onChange={(event) => setSessionTitle(event.target.value)}
                  placeholder="AheadClock 产品定位"
                />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Parse Suggestions</h2>
              <Button onClick={handleParse} variant="secondary">
                Parse
              </Button>
            </div>
            <textarea
              className="min-h-48 w-full resize-y rounded-lg border border-input bg-transparent p-3 font-mono text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
              placeholder={"- item\n* item\n1. item\n- [x] accepted item\n- [ ] pending item"}
            />
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Decision Table</h2>
              <div className="flex flex-wrap items-center gap-2">
                {saveMessage && <span className="text-sm text-muted-foreground">{saveMessage}</span>}
                <Button onClick={handleSave} disabled={!canSave}>
                  <Save />
                  Save Session
                </Button>
                <Button
                  onClick={() => setExportOpen(true)}
                  variant="outline"
                  disabled={decisions.length === 0}
                >
                  <FileDown />
                  Export Markdown
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="w-36 px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Decision</th>
                    <th className="w-12 px-3 py-2 text-right font-medium" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {decisions.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-muted-foreground" colSpan={3}>
                        No parsed decisions.
                      </td>
                    </tr>
                  ) : (
                    decisions.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-2 align-top">
                          <select
                            className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                            value={item.status}
                            onChange={(event) =>
                              updateDecision(item.id, {
                                status: event.target.value as DecisionStatus,
                              })
                            }
                          >
                            <option value="pending">pending</option>
                            <option value="accepted">accepted</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <input
                            className="h-8 w-full rounded-lg border border-transparent bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            value={item.text}
                            onChange={(event) =>
                              updateDecision(item.id, { text: event.target.value })
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-right align-top">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeDecision(item.id)}
                            aria-label="Remove decision"
                          >
                            <Trash2 />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {exportOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-title"
        >
          <div className="w-full max-w-3xl rounded-lg border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 id="export-title" className="text-sm font-semibold">
                Markdown Export
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setExportOpen(false)}
                aria-label="Close export modal"
              >
                <X />
              </Button>
            </div>
            <div className="p-4">
              <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                {exportedMarkdown}
              </pre>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
              <Button variant="outline" onClick={copyMarkdown}>
                {copied ? <Check /> : <Clipboard />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button onClick={() => setExportOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
