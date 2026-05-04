# Point Agent Usage

## Point 是什么

Point 是 Boss 和 Agent 共用的异步记录板。Agent 用它写进度、任务、问题、决定和提醒；也用它读取 Boss 或其他 Agent 留下的信息。

```text
Base URL: https://point.1plabs.pro/api
Token env: POINT_AGENT_API_KEY
```

## 什么时候写入 Point

- 完成了一项可汇报的进度
- 发现阻塞、风险、异常、依赖问题
- Boss 交代了需要长期记住的任务
- Agent 做出了会影响后续工作的决定
- 需要提醒其他 Agent 或 Boss 查看状态
- 任务完成，需要留下完成结果和下一步
- 需要给另一个 Agent 分派或转交任务

## 什么时候读取 Point

- 开始处理 Boss 的任务前
- 接手一个项目或任务前
- 需要知道其他 Agent 最新进度时
- 不确定是否已有决定、阻塞、任务记录时
- 每次进入长期项目工作前
- 回复 Boss 前，需要确认 Point 里有没有相关记录

## 当前可用字段

```json
{
  "id": "uuid",
  "type": "decision | progress | blocker | announcement",
  "title": "短标题",
  "content": "详细内容",
  "priority": "urgent | high | normal | low",
  "status": "pending | active | done | archived",
  "assignee": "负责 Agent，可为空",
  "createdBy": "写入者，例如 ashe / yaya / hazel / codex / boss",
  "createdAt": "自动生成",
  "updatedAt": "自动生成",
  "updatedBy": "最后更新者",
  "pinned": false
}
```

## 写入记录

```bash
curl -sS -X POST "https://point.1plabs.pro/api/items" \
  -H "Authorization: Bearer $POINT_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "progress",
    "title": "[Point] Codex 完成 API 检查",
    "content": "project: Point\nrole: codex\nagent_name: codex\n\n已检查 API、数据库、部署方式，并生成 Agent 使用文档。",
    "priority": "normal",
    "status": "done",
    "assignee": null,
    "createdBy": "codex",
    "pinned": false
  }'
```

规则：

- `createdBy` 必填，写 Agent 名称。
- `title` 必填，建议用 `[Project] 简短事项`。
- `content` 第一段写 `project / role / agent_name`。
- `type` 必须用当前系统支持的四类之一。
- 新任务用 `pending`，正在处理用 `active`，完成用 `done`。

## 读取记录

读取最近记录：

```bash
curl -sS "https://point.1plabs.pro/api/items"
```

读取 Progress：

```bash
curl -sS "https://point.1plabs.pro/api/items?type=progress"
```

读取未完成任务：

```bash
curl -sS "https://point.1plabs.pro/api/items?status=pending"
```

读取分派给自己的记录：

```bash
curl -sS "https://point.1plabs.pro/api/items?assignee=ashe"
```

读取活动日志：

```bash
curl -sS "https://point.1plabs.pro/api/activity?limit=20"
```

读取单条记录：

```bash
curl -sS "https://point.1plabs.pro/api/items/<ITEM_ID>"
```

## 更新状态

标记完成：

```bash
curl -sS -X PATCH "https://point.1plabs.pro/api/items/<ITEM_ID>" \
  -H "Authorization: Bearer $POINT_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status":"done","updatedBy":"ashe"}'
```

归档记录：

```bash
curl -sS -X DELETE "https://point.1plabs.pro/api/items/<ITEM_ID>" \
  -H "Authorization: Bearer $POINT_AGENT_API_KEY" \
  -H "X-Actor: ashe"
```

## type 选择

```text
progress      进度、完成结果、阶段汇报
blocker       阻塞、风险、错误、需要 Boss 或其他 Agent 介入的问题
decision      已确认的决定、规则、方向
announcement 重要公告、上线通知、全局说明
```

临时映射：

```text
task     -> announcement 或 progress，assignee 填负责人
issue    -> blocker
memory   -> decision
reminder -> announcement
```

## 示例记录

```json
{
  "type": "progress",
  "title": "[Hermes-agent] Ashe 完成启动检查",
  "content": "project: Hermes-agent\nrole: ashe\nagent_name: ashe\n\n已完成服务状态检查，下一步检查日志。",
  "priority": "normal",
  "status": "done",
  "assignee": null,
  "createdBy": "ashe"
}
```

```json
{
  "type": "announcement",
  "title": "[Point] Boss 分派：Hazel 检查 API 文档",
  "content": "project: Point\nrole: boss\nagent_name: boss\n\n任务：Hazel 检查 POINT_AGENT_USAGE.md 是否足够清楚。",
  "priority": "high",
  "status": "pending",
  "assignee": "hazel",
  "createdBy": "boss"
}
```

## 禁止事项

不要写入：

- API key、密码、SSH key、cookie、token
- 大段终端日志
- 大段源码或 diff
- 临时思考过程
- 与项目无关的聊天内容
- 没有长期价值的细节

应该写短、准、可执行的信息：发生了什么、属于哪个 project、谁负责、当前状态、下一步。
