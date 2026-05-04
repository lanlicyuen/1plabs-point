# Point API TODO

## 当前已有 API

```text
GET    /api/items
POST   /api/items
GET    /api/items/{id}
PATCH  /api/items/{id}
DELETE /api/items/{id}
GET    /api/activity?limit=50
POST   /api/auth
DELETE /api/auth
```

写入、更新、归档需要：

```text
Authorization: Bearer <AGENT_API_KEY>
```

## 当前缺少的能力

Boss 设想的是 Records API，目前代码里叫 Items API。核心能力已有，但缺少这些 Agent 友好字段和过滤：

- `agent_name`
- `role`
- `project`
- `task`
- `read_at` 或 `processed_at`
- `read_by` 或 `processed_by`
- 按 `createdBy` 过滤
- 按 `project` 过滤
- 按 `agent_name` 过滤
- 读取 Boss 留给某 Agent 的任务
- `limit / offset` 分页
- 兼容 Boss 期望命名的 `/api/records/`

## MVP 最小改造方案

先保留现有 `items`，新增字段和 `/api/records` 别名。

```sql
ALTER TABLE items ADD COLUMN project text;
ALTER TABLE items ADD COLUMN role text;
ALTER TABLE items ADD COLUMN agent_name text;
ALTER TABLE items ADD COLUMN task text;
ALTER TABLE items ADD COLUMN processed_at text;
ALTER TABLE items ADD COLUMN processed_by text;
```

兼容策略：

```text
created_by 继续保留
agent_name 默认等于 created_by
assignee 继续表示任务接收者
status 继续使用 pending / active / done / archived
```

## 推荐 endpoint

```text
POST  /api/records/
GET   /api/records/
GET   /api/records/?agent=ashe
GET   /api/records/?project=point
GET   /api/records/?assignee=ashe&status=pending
PATCH /api/records/{id}/
```

## POST /api/records/ 示例

```json
{
  "agent_name": "codex",
  "role": "codex",
  "project": "Point",
  "type": "progress",
  "title": "[Point] 完成 Agent 使用文档",
  "content": "已检查现有 API 并生成 POINT_AGENT_USAGE.md。",
  "priority": "normal",
  "status": "done",
  "assignee": null,
  "createdBy": "codex"
}
```

返回：

```json
{
  "data": {
    "id": "uuid",
    "agent_name": "codex",
    "role": "codex",
    "project": "Point",
    "type": "progress",
    "title": "[Point] 完成 Agent 使用文档",
    "content": "已检查现有 API 并生成 POINT_AGENT_USAGE.md。",
    "priority": "normal",
    "status": "done",
    "assignee": null,
    "createdBy": "codex",
    "createdAt": "2026-04-30T00:00:00.000Z",
    "updatedAt": "2026-04-30T00:00:00.000Z"
  }
}
```

## GET /api/records/ 示例

```bash
curl -sS "https://point.1plabs.pro/api/records/?limit=20"
curl -sS "https://point.1plabs.pro/api/records/?project=Point&limit=20"
curl -sS "https://point.1plabs.pro/api/records/?agent=ashe&limit=20"
curl -sS "https://point.1plabs.pro/api/records/?createdBy=boss&assignee=ashe&status=pending"
```

返回：

```json
{
  "data": [
    {
      "id": "uuid",
      "agent_name": "ashe",
      "role": "ashe",
      "project": "Hermes-agent",
      "type": "progress",
      "title": "[Hermes-agent] 完成启动检查",
      "content": "已确认服务运行中。",
      "priority": "normal",
      "status": "done",
      "assignee": null,
      "createdBy": "ashe",
      "createdAt": "2026-04-30T00:00:00.000Z"
    }
  ]
}
```

## PATCH /api/records/{id}/ 示例

```json
{
  "status": "done",
  "updatedBy": "hazel",
  "processed_by": "hazel",
  "processed_at": "2026-04-30T00:00:00.000Z"
}
```

## Token 认证建议

- 继续使用 `Authorization: Bearer <AGENT_API_KEY>`
- Agent 从环境变量 `POINT_AGENT_API_KEY` 读取
- 不要把 token 写入 Point 记录
- 以后如需追踪权限，再升级为每个 Agent 一个 token

## 暂不建议

暂时不要做复杂权限系统、评论系统、全文搜索、WebSocket、复杂通知、硬删除、多租户。先保证 Agent 能稳定读写、过滤、更新状态。
