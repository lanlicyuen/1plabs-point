"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DecisionStatus = "pending" | "accepted" | "rejected";

type DecisionItem = {
  id: string;
  content: string;
  status: DecisionStatus;
  note: string;
};

const sampleInput = "- 先做 Android\n- 后做 iOS\n- 不做会员系统";

const statusOptions: DecisionStatus[] = ["pending", "accepted", "rejected"];

function normalizeSuggestion(line: string) {
  return line
    .trim()
    .replace(/^[-*+]\s+\[[ xX]\]\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}

function parseSuggestions(input: string): DecisionItem[] {
  return input
    .split(/\r?\n/)
    .map(normalizeSuggestion)
    .filter(Boolean)
    .map((content, index) => ({
      id: `${Date.now()}-${index}-${content}`,
      content,
      status: "pending",
      note: "",
    }));
}

function formatSection(title: string, items: DecisionItem[]) {
  const lines = items.map((item) => {
    const note = item.note.trim() ? `（${item.note.trim()}）` : "";
    return `- ${item.content}${note}`;
  });

  return [title, ...(lines.length > 0 ? lines : ["- 无"])].join("\n");
}

export default function DecisionsPage() {
  const [rawSuggestions, setRawSuggestions] = useState(sampleInput);
  const [items, setItems] = useState<DecisionItem[]>([]);
  const [exportText, setExportText] = useState("");

  const grouped = useMemo(
    () => ({
      accepted: items.filter((item) => item.status === "accepted"),
      rejected: items.filter((item) => item.status === "rejected"),
      pending: items.filter((item) => item.status === "pending"),
    }),
    [items]
  );

  function handleParse() {
    setItems(parseSuggestions(rawSuggestions));
    setExportText("");
  }

  function updateItem(id: string, patch: Partial<DecisionItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function handleExport() {
    setExportText(
      [
        formatSection("接受：", grouped.accepted),
        formatSection("拒绝：", grouped.rejected),
        formatSection("待定：", grouped.pending),
      ].join("\n\n")
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Point Decisions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Turn AI suggestions into accepted, rejected, and pending decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">AI Suggestions</h2>
            <Button onClick={handleParse} size="sm">
              <ClipboardList />
              Parse Suggestions
            </Button>
          </div>

          <textarea
            value={rawSuggestions}
            onChange={(event) => setRawSuggestions(event.target.value)}
            className="min-h-72 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            placeholder={"- Android\n- iOS\n不做会员系统"}
          />
        </section>

        <section className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Decision Table</h2>
            <Button
              onClick={handleExport}
              size="sm"
              variant="outline"
              disabled={items.length === 0}
            >
              <Download />
              Export Markdown
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/70 text-muted-foreground">
                <tr>
                  <th className="w-[48%] px-3 py-2 text-left font-medium">内容</th>
                  <th className="w-36 px-3 py-2 text-left font-medium">状态</th>
                  <th className="px-3 py-2 text-left font-medium">备注</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2 align-top">{item.content}</td>
                    <td className="px-3 py-2 align-top">
                      <select
                        value={item.status}
                        onChange={(event) =>
                          updateItem(item.id, {
                            status: event.target.value as DecisionStatus,
                          })
                        }
                        className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        value={item.note}
                        onChange={(event) =>
                          updateItem(item.id, { note: event.target.value })
                        }
                        placeholder="Optional note"
                      />
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-12 text-center text-sm text-muted-foreground"
                    >
                      Paste suggestions and parse them to create decision rows.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <textarea
            value={exportText}
            readOnly
            className="mt-4 min-h-44 w-full resize-y rounded-lg border border-input bg-muted/30 px-3 py-2 font-mono text-sm outline-none dark:bg-input/20"
            placeholder="Exported markdown appears here."
          />
        </section>
      </div>
    </div>
  );
}
