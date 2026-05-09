"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Download } from "lucide-react";
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
const fallbackScript = `
(function () {
  function normalizeSuggestion(line) {
    return line
      .trim()
      .replace(/^[-*+]\\s+(?:\\[[ xX]\\]\\s+)?/, "")
      .replace(/^\\d+[.)]\\s+/, "")
      .trim();
  }

  function parseSuggestions(input) {
    return input
      .split(/\\r?\\n/)
      .map(normalizeSuggestion)
      .filter(Boolean)
      .map(function (content) {
        return { content: content, status: "pending", note: "" };
      });
  }

  function createCell(text) {
    var cell = document.createElement("td");
    cell.className = "px-3 py-2 align-top";
    cell.textContent = text;
    return cell;
  }

  function renderRows(items) {
    var body = document.getElementById("decision-table-body");
    var exportButton = document.getElementById("decision-export-button");
    if (!body || !exportButton) return;

    body.textContent = "";
    items.forEach(function (item) {
      var row = document.createElement("tr");
      row.className = "border-t";
      row.dataset.decisionRow = "true";

      row.appendChild(createCell(item.content));

      var statusCell = document.createElement("td");
      statusCell.className = "px-3 py-2 align-top";
      var status = document.createElement("select");
      status.className = "h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
      ["pending", "accepted", "rejected"].forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        status.appendChild(option);
      });
      status.value = item.status;
      statusCell.appendChild(status);
      row.appendChild(statusCell);

      var noteCell = document.createElement("td");
      noteCell.className = "px-3 py-2 align-top";
      var note = document.createElement("input");
      note.className = "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";
      note.placeholder = "Optional note";
      noteCell.appendChild(note);
      row.appendChild(noteCell);

      body.appendChild(row);
    });

    exportButton.disabled = items.length === 0;
  }

  function readRows() {
    return Array.from(document.querySelectorAll("#decision-table-body tr[data-decision-row]")).map(function (row) {
      var cells = row.querySelectorAll("td");
      return {
        content: cells[0] ? cells[0].textContent.trim() : "",
        status: row.querySelector("select") ? row.querySelector("select").value : "pending",
        note: row.querySelector("input") ? row.querySelector("input").value.trim() : "",
      };
    }).filter(function (item) {
      return item.content;
    });
  }

  function formatSection(title, items) {
    var lines = items.map(function (item) {
      return "- " + item.content + (item.note ? "（" + item.note + "）" : "");
    });
    return [title].concat(lines.length ? lines : ["- 无"]).join("\\n");
  }

  function bindDecisionsFallback() {
    var input = document.getElementById("decision-suggestions-input");
    var parseButton = document.getElementById("decision-parse-button");
    var exportButton = document.getElementById("decision-export-button");
    var output = document.getElementById("decision-export-output");
    if (!input || !parseButton || !exportButton || !output || parseButton.dataset.fallbackBound === "true") return;

    parseButton.dataset.fallbackBound = "true";
    parseButton.addEventListener("click", function () {
      renderRows(parseSuggestions(input.value));
      output.value = "";
    });

    exportButton.addEventListener("click", function () {
      var rows = readRows();
      var accepted = rows.filter(function (item) { return item.status === "accepted"; });
      var rejected = rows.filter(function (item) { return item.status === "rejected"; });
      var pending = rows.filter(function (item) { return item.status === "pending"; });
      output.value = [
        formatSection("接受：", accepted),
        formatSection("拒绝：", rejected),
        formatSection("待定：", pending),
      ].join("\\n\\n");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindDecisionsFallback);
  } else {
    bindDecisionsFallback();
  }
})();
`;
const buttonClass =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4";
const outlineButtonClass =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50 [&_svg]:size-4";

function normalizeSuggestion(line: string) {
  return line
    .trim()
    .replace(/^[-*+]\s+(?:\[[ xX]\]\s+)?/, "")
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
    const parsedItems = parseSuggestions(rawSuggestions);
    setItems(parsedItems);
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
            <button
              id="decision-parse-button"
              type="button"
              onClick={handleParse}
              className={buttonClass}
            >
              <ClipboardList aria-hidden="true" />
              Parse Suggestions
            </button>
          </div>

          <textarea
            id="decision-suggestions-input"
            value={rawSuggestions}
            onChange={(event) => setRawSuggestions(event.target.value)}
            className="min-h-72 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            placeholder={"- Android\n- iOS\n不做会员系统"}
          />
        </section>

        <section className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Decision Table</h2>
            <button
              id="decision-export-button"
              type="button"
              onClick={handleExport}
              disabled={items.length === 0}
              className={outlineButtonClass}
            >
              <Download aria-hidden="true" />
              Export Markdown
            </button>
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
              <tbody id="decision-table-body">
                {items.map((item) => (
                  <tr key={item.id} className="border-t" data-decision-row="true">
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
            id="decision-export-output"
            value={exportText}
            readOnly
            className="mt-4 min-h-44 w-full resize-y rounded-lg border border-input bg-muted/30 px-3 py-2 font-mono text-sm outline-none dark:bg-input/20"
            placeholder="Exported markdown appears here."
          />
        </section>
      </div>
      <script dangerouslySetInnerHTML={{ __html: fallbackScript }} />
    </div>
  );
}
