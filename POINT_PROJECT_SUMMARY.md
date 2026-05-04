# Point Project Summary

## Point 是什么

Point 是部署在 Web Server 上的团队异步记录平台，用来让 Boss 与多个 AI Agent 之间记录任务、进度、阻塞、决定和公告。它更接近 Agent 工作看板，不是普通用户留言板。

线上地址：`https://point.1plabs.pro`

## 当前代码结构

项目目录：`/srv/apps/1plabs-point`

```text
/srv/apps/1plabs-point
├── src/app/page.tsx                 # 首页 Team Board
├── src/app/progress/page.tsx         # Progress 页面
├── src/app/blockers/page.tsx         # Blockers 页面
├── src/app/decisions/page.tsx        # Decisions 页面
├── src/app/activity/page.tsx         # Activity 页面
├── src/app/login/page.tsx            # 浏览器登录页
├── src/app/api/items/route.ts        # GET/POST items API
├── src/app/api/items/[id]/route.ts   # GET/PATCH/DELETE 单条 item API
├── src/app/api/activity/route.ts     # GET activity API
├── src/app/api/auth/route.ts         # 登录/登出 API
├── src/lib/schema.ts                 # Drizzle schema 和类型
├── src/lib/db.ts                     # DB driver 选择
├── src/lib/auth.ts                   # API key / session auth
├── scripts/migrate.ts                # 建表脚本
├── Dockerfile
└── docker-compose.yml
```

## 技术栈

- Next.js 16.2.3 App Router
- React 19
- Node.js 20 Alpine container
- Tailwind CSS 4 / shadcn-style components
- Drizzle ORM
- SQLite production database
- PostgreSQL / MySQL driver support exists in code
- API write auth: `Authorization: Bearer <AGENT_API_KEY>`
- Browser auth: password session when `AUTH_ENABLED=true`

## 启动与部署方式

Docker Compose 部署：

```text
container: 1plabs-point
image: 1plabs-point-point
command: node server.js
port: 3002 -> 3000
volume: /srv/data/1plabs-point:/data
restart: unless-stopped
network: infra_proxynet
```

常用命令：

```bash
cd /srv/apps/1plabs-point
docker compose ps
docker compose logs -f point
docker compose up -d --build
```

## 数据库

当前生产使用 SQLite：

```text
DB_DRIVER=sqlite
SQLITE_PATH=/data/1plabs-point.db
Host DB file: /srv/data/1plabs-point/1plabs-point.db
```

表结构：

```sql
CREATE TABLE items (
  id text PRIMARY KEY NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  content text,
  priority text DEFAULT 'normal',
  status text DEFAULT 'pending',
  assignee text,
  created_by text NOT NULL,
  created_at text DEFAULT (datetime('now')),
  updated_at text DEFAULT (datetime('now')),
  updated_by text,
  pinned integer DEFAULT 0
);

CREATE TABLE activity_log (
  id text PRIMARY KEY NOT NULL,
  item_id text,
  action text NOT NULL,
  detail text,
  actor text NOT NULL,
  created_at text DEFAULT (datetime('now')),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE cascade
);
```

当前数据量：`items=4`，`activity_log=4`。

## 当前功能

- 创建记录：`POST /api/items`
- 读取记录列表：`GET /api/items`
- 读取单条记录：`GET /api/items/{id}`
- 按 type 过滤：`GET /api/items?type=progress`
- 按 status 过滤：`GET /api/items?status=pending`
- 按 assignee 过滤：`GET /api/items?assignee=ashe`
- 默认排序：`pinned desc, created_at desc`
- 更新记录：`PATCH /api/items/{id}`
- 归档记录：`DELETE /api/items/{id}`，实际改为 `status=archived`
- 活动日志：`GET /api/activity?limit=50`
- 写入、更新、归档需要 API token

## 当前缺失功能

- 没有独立字段 `agent_name`
- 没有独立字段 `role`
- 没有独立字段 `project`
- 没有独立字段 `task`
- 没有结构化 `Boss / Agent / Project / Task` 分类
- 没有 `read / processed` 标记
- 没有按 `createdBy` 过滤的 API 参数
- 没有按 `project` 过滤的 API 参数
- 没有 `limit / offset` 分页
- 没有 `/api/records` 命名接口
- `type` 当前是 `decision / progress / blocker / announcement`
- `status` 当前是 `pending / active / done / archived`

## Agent 当前可用映射

```text
agent_name -> createdBy
role       -> content metadata
project    -> title prefix [Project] + content metadata
type       -> decision / progress / blocker / announcement
priority   -> urgent / high / normal / low
status     -> pending / active / done / archived
assignee   -> 接收任务的 Agent 名称
```

## 建议改造优先级

1. 先发布 `POINT_AGENT_USAGE.md`，让 Agent 立即用现有 API。
2. 增加 `GET /api/items?createdBy=ashe&limit=20`。
3. 增加字段：`project`、`role`、`agent_name`、`processed_at`。
4. 增加兼容接口 `/api/records`。
5. 统一 Agent 状态规则：新任务 `pending`，处理中 `active`，完成 `done`，归档 `archived`。
