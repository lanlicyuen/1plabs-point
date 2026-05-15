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
import { useI18n } from "@/components/LanguageProvider";

type DecisionStatus = "pending" | "accepted" | "rejected" | "completed" | "archived";

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
  sessionNotes?: string;
  exportedMarkdown: string;
  decisions: DecisionItem[];
  createdAt: string;
};

const STORAGE_KEY = "point-decisions-v2-sessions";
const DECISION_STATUSES = ["pending", "accepted", "rejected", "completed", "archived"] as const;
const STATUS_LABELS: Record<DecisionStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  completed: "Completed",
  archived: "Archived",
};
const STATUS_SELECT_CLASSES: Record<DecisionStatus, string> = {
  pending: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200",
  accepted: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200",
  rejected: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200",
  completed: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200",
  archived: "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300",
};
const DECISION_VERBS =
  /(accept|adopt|allow|approve|build|cancel|choose|defer|deny|disable|enable|launch|migrate|pause|reject|remove|require|ship|start|stop|support|use|采用|保留|关闭|决定|启用|取消|否决|启动|开发|拒绝|接受|支持|暂停|改为|新增|确定|禁用|移除|采用|使用|选择|避免|允许|上线|暂不|需要)/i;

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isMarkdownDivider(line: string) {
  return /^(?:-{3,}|\*{3,}|_{3,})$/.test(line);
}

function isHeading(line: string) {
  return /^#{1,6}\s+\S/.test(line);
}

function isColonTitle(line: string) {
  return /[:：]$/.test(line) && !/[。.!?！？]$/.test(line);
}

function normalizeDecisionText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

function isDecisionText(text: string) {
  const normalized = normalizeDecisionText(text);
  const compact = normalized.replace(/\s/g, "");

  if (compact.length < 4) return false;
  if (isHeading(normalized) || isMarkdownDivider(normalized) || normalized.startsWith(">")) return false;
  if (isColonTitle(normalized)) return false;
  if (/^[\p{L}\p{N}\s/_-]+$/u.test(normalized) && !DECISION_VERBS.test(normalized)) return false;

  return DECISION_VERBS.test(normalized);
}

function parseDecisionLine(rawLine: string): DecisionItem | null {
  const line = rawLine.trim();

  if (!line || isHeading(line) || isMarkdownDivider(line) || line.startsWith(">") || isColonTitle(line)) {
    return null;
  }

  const checkbox = line.match(/^[-*]\s+\[([xX ])\]\s+(.+)$/);
  if (checkbox) {
    const text = normalizeDecisionText(checkbox[2]);
    if (!isDecisionText(text)) return null;

    return {
      id: createId(),
      text,
      status: checkbox[1].toLowerCase() === "x" ? "accepted" : "pending",
    };
  }

  const bullet = line.match(/^[-*]\s+(.+)$/);
  if (bullet) {
    const text = normalizeDecisionText(bullet[1]);
    return isDecisionText(text) ? { id: createId(), text, status: "pending" } : null;
  }

  const numbered = line.match(/^\d+\.\s+(.+)$/);
  if (numbered) {
    const text = normalizeDecisionText(numbered[1]);
    return isDecisionText(text) ? { id: createId(), text, status: "pending" } : null;
  }

  return null;
}

function parseSession(input: string): { sessionNotes: string; decisions: DecisionItem[] } {
  const decisions: DecisionItem[] = [];
  const notes: string[] = [];

  for (const rawLine of input.split(/\r?\n/)) {
    const decision = parseDecisionLine(rawLine);
    if (decision) {
      decisions.push(decision);
      continue;
    }

    notes.push(rawLine);
  }

  return {
    sessionNotes: notes.join("\n").trim(),
    decisions,
  };
}

function normalizeDecisionStatus(status: unknown): DecisionStatus {
  if (typeof status !== "string") return "pending";
  if ((DECISION_STATUSES as readonly string[]).includes(status)) return status as DecisionStatus;
  if (status === "active") return "pending";
  if (status === "done" || status === "closed" || status === "resolved") return "completed";
  return "pending";
}

function normalizeDecision(item: Partial<DecisionItem>): DecisionItem | null {
  if (typeof item.text !== "string" || !item.text.trim()) return null;

  return {
    id: typeof item.id === "string" && item.id.trim() ? item.id : createId(),
    text: item.text,
    status: normalizeDecisionStatus(item.status),
  };
}

function normalizeSession(session: Partial<SavedSession>): SavedSession | null {
  if (typeof session.id !== "string" || !session.id.trim()) return null;

  const rawInput = typeof session.rawInput === "string" ? session.rawInput : "";
  const parsed = parseSession(rawInput);
  const decisions = Array.isArray(session.decisions)
    ? session.decisions.map((item) => normalizeDecision(item)).filter((item): item is DecisionItem => Boolean(item))
    : parsed.decisions;

  return {
    id: session.id,
    projectTitle: typeof session.projectTitle === "string" ? session.projectTitle : "",
    sessionTitle: typeof session.sessionTitle === "string" ? session.sessionTitle : "",
    rawInput,
    sessionNotes: typeof session.sessionNotes === "string" ? session.sessionNotes : parsed.sessionNotes,
    exportedMarkdown: typeof session.exportedMarkdown === "string" ? session.exportedMarkdown : "",
    decisions,
    createdAt: typeof session.createdAt === "string" ? session.createdAt : new Date().toISOString(),
  };
}

function getStatusCounts(decisions: DecisionItem[]) {
  return decisions.reduce<Record<DecisionStatus, number>>(
    (counts, item) => {
      counts[normalizeDecisionStatus(item.status)] += 1;
      return counts;
    },
    { pending: 0, accepted: 0, rejected: 0, completed: 0, archived: 0 }
  );
}

function buildMarkdown(
  projectTitle: string,
  sessionTitle: string,
  sessionNotes: string,
  decisions: DecisionItem[]
) {
  const statusCounts = getStatusCounts(decisions);
  const lines = [
    `# ${projectTitle || "Untitled Project"}`,
    "",
    `## ${sessionTitle || "Untitled Session"}`,
    "",
    "### Notes",
    sessionNotes.trim() || "_No notes._",
    "",
    "### Status Summary",
    "",
    `- Pending: ${statusCounts.pending}`,
    `- Accepted: ${statusCounts.accepted}`,
    `- Rejected: ${statusCounts.rejected}`,
    `- Completed: ${statusCounts.completed}`,
    `- Archived: ${statusCounts.archived}`,
    "",
    "### Decisions",
    "",
    "| Status | Decision |",
    "| --- | --- |",
    ...decisions.map((item) => {
      const label = STATUS_LABELS[normalizeDecisionStatus(item.status)];
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
    return Array.isArray(parsed)
      ? parsed.map((session) => normalizeSession(session)).filter((session): session is SavedSession => Boolean(session))
      : [];
  } catch {
    return [];
  }
}

export default function DecisionsWorkspace() {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [projectTitle, setProjectTitle] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
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
    () => buildMarkdown(projectTitle, sessionTitle, sessionNotes, decisions),
    [projectTitle, sessionTitle, sessionNotes, decisions]
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
    (sessionNotes.trim().length > 0 || decisions.length > 0);

  const canExport = sessionNotes.trim().length > 0 || decisions.length > 0;

  function persistSessions(nextSessions: SavedSession[]) {
    setSessions(nextSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
  }

  function handleParse() {
    const parsed = parseSession(rawInput);
    setSessionNotes(parsed.sessionNotes);
    setDecisions(parsed.decisions);
    setSaveMessage("");
  }

  async function syncBoardCard(session: SavedSession) {
    const statusCounts = getStatusCounts(session.decisions);
    const response = await fetch("/api/decision-session-board-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decisionSessionId: session.id,
        projectTitle: session.projectTitle,
        sessionTitle: session.sessionTitle,
        decisionCount: session.decisions.length,
        statusCounts,
      }),
    });

    if (!response.ok) {
      throw new Error("Could not sync Board card.");
    }
  }

  async function handleSave() {
    if (!canSave) {
      setSaveMessage(t.decisions.saveRequired);
      return;
    }

    const saved: SavedSession = {
      id: activeSessionId ?? createId(),
      projectTitle: projectTitle.trim(),
      sessionTitle: sessionTitle.trim(),
      rawInput,
      sessionNotes,
      exportedMarkdown,
      decisions: decisions.map((item) => ({ ...item, status: normalizeDecisionStatus(item.status) })),
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
      setSaveMessage(t.decisions.saveSynced);
    } catch {
      setSaveMessage(t.decisions.saveLocalOnly);
    }
  }

  function restoreSession(session: SavedSession) {
    const normalizedSession = normalizeSession(session);
    if (!normalizedSession) return;

    setActiveSessionId(session.id);
    setProjectTitle(normalizedSession.projectTitle);
    setSessionTitle(normalizedSession.sessionTitle);
    setRawInput(normalizedSession.rawInput);
    setSessionNotes(normalizedSession.sessionNotes ?? parseSession(normalizedSession.rawInput).sessionNotes);
    setDecisions(normalizedSession.decisions);
    setSaveMessage("");
    setExportOpen(false);
  }

  function resetWorkspace() {
    setActiveSessionId(null);
    setProjectTitle("");
    setSessionTitle("");
    setRawInput("");
    setSessionNotes("");
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
          <h2 className="text-sm font-semibold">{t.decisions.history}</h2>
          <Button variant="ghost" size="icon-sm" onClick={resetWorkspace} aria-label={t.decisions.newSession}>
            <RotateCcw />
          </Button>
        </div>

        {Object.keys(groupedSessions).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.decisions.noSavedSessions}</p>
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
            <span>⚖️</span> {t.decisions.pageTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.decisions.pageDescription}
          </p>
        </div>

        <div className="grid gap-4">
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                {t.decisions.projectTitle}
                <Input
                  required
                  value={projectTitle}
                  onChange={(event) => setProjectTitle(event.target.value)}
                  placeholder="例如：时间管理策划"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                {t.decisions.sessionTitle}
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
              <h2 className="text-sm font-semibold">{t.decisions.parseSuggestions}</h2>
              <Button onClick={handleParse} variant="secondary">
                {t.decisions.parse}
              </Button>
            </div>
            <textarea
              className="min-h-48 w-full resize-y rounded-lg border border-input bg-transparent p-3 font-mono text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
              placeholder={"# 当前进度\n\nAheadClock 已完成 Android MVP。\n\n- 先开发 Android\n- 暂不开发 iOS\n- 使用 Flutter"}
            />
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">{t.decisions.sessionNotes}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.decisions.sessionNotesDescription}
                </p>
              </div>
            </div>
            <pre className="max-h-72 min-h-36 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-sm leading-6 whitespace-pre-wrap text-foreground dark:bg-input/20">{sessionNotes || t.decisions.noNotes}</pre>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">{t.decisions.decisionTable}</h2>
              <div className="flex flex-wrap items-center gap-2">
                {saveMessage && <span className="text-sm text-muted-foreground">{saveMessage}</span>}
                <Button onClick={handleSave} disabled={!canSave}>
                  <Save />
                  {t.decisions.saveSession}
                </Button>
                <Button
                  onClick={() => setExportOpen(true)}
                  variant="outline"
                  disabled={!canExport}
                >
                  <FileDown />
                  {t.decisions.exportMarkdown}
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="w-32 px-3 py-2 text-left font-medium">{t.decisions.status}</th>
                    <th className="px-3 py-2 text-left font-medium">{t.decisions.decision}</th>
                    <th className="w-11 px-2 py-2 text-right font-medium" aria-label={t.decisions.actions} />
                  </tr>
                </thead>
                <tbody>
                  {decisions.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-muted-foreground" colSpan={3}>
                        {t.decisions.noParsedDecisions}
                      </td>
                    </tr>
                  ) : (
                    decisions.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-1.5 align-top">
                          <select
                            className={`h-7 w-full rounded-md border px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${STATUS_SELECT_CLASSES[item.status]}`}
                            value={item.status}
                            onChange={(event) =>
                              updateDecision(item.id, {
                                status: event.target.value as DecisionStatus,
                              })
                            }
                          >
                            {DECISION_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {t.status[status]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-1.5 align-top">
                          <input
                            className="h-7 w-full rounded-md border border-transparent bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            value={item.text}
                            onChange={(event) =>
                              updateDecision(item.id, { text: event.target.value })
                            }
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right align-top">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeDecision(item.id)}
                            aria-label={t.decisions.removeDecision}
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
                {t.decisions.markdownExport}
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setExportOpen(false)}
                aria-label={t.decisions.closeExportModal}
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
                {copied ? t.decisions.copied : t.decisions.copy}
              </Button>
              <Button onClick={() => setExportOpen(false)}>{t.decisions.close}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
