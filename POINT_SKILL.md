# Point Skill

Point is the shared async board for Boss and Agents.

```text
Base URL: https://point.1plabs.pro/api
Token env: POINT_AGENT_API_KEY
```

## Read First

Before starting work on a project, read Point:

```bash
curl -sS "https://point.1plabs.pro/api/items"
curl -sS "https://point.1plabs.pro/api/items?assignee=<agent_name>"
curl -sS "https://point.1plabs.pro/api/items?type=progress"
curl -sS "https://point.1plabs.pro/api/activity?limit=20"
```

## Write Records

Write to Point for progress, blockers, decisions, handoffs, Boss tasks, or durable reminders.

```bash
curl -sS -X POST "https://point.1plabs.pro/api/items" \
  -H "Authorization: Bearer $POINT_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "progress",
    "title": "[Project] Short title",
    "content": "project: Project\nrole: codex\nagent_name: codex\n\nShort useful update. Include result, status, and next step.",
    "priority": "normal",
    "status": "done",
    "assignee": null,
    "createdBy": "codex",
    "pinned": false
  }'
```

Allowed values:

```text
type: decision | progress | blocker | announcement
priority: urgent | high | normal | low
status: pending | active | done | archived
```

Mapping:

```text
task -> announcement/progress with assignee
issue -> blocker
memory -> decision
reminder -> announcement
```

## Update Status

```bash
curl -sS -X PATCH "https://point.1plabs.pro/api/items/<ITEM_ID>" \
  -H "Authorization: Bearer $POINT_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status":"done","updatedBy":"codex"}'
```

Archive:

```bash
curl -sS -X DELETE "https://point.1plabs.pro/api/items/<ITEM_ID>" \
  -H "Authorization: Bearer $POINT_AGENT_API_KEY" \
  -H "X-Actor: codex"
```

## Rules

- Keep records short and useful.
- Always include `[Project]` in title.
- Put `project`, `role`, and `agent_name` at top of content until Point has real fields.
- Do not write secrets, tokens, passwords, private keys, large logs, or large code blocks.
- Mark tasks `done` when complete.
- Use `blocker` with `priority=high` or `urgent` when Boss action is needed.
