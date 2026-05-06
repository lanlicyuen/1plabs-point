# Point Rules — 开发规则与团队分工

## 开发规则

1. **Web Server 禁止直接开发** — 所有代码修改必须在 Dev Server (1.1.1.7) 上进行。
2. **GitHub 是唯一同步中心** — Dev/Web 之间不直接同步，必须通过 push/pull。
3. **每次升级必须记录 Upgrade Log** — 在 Point 平台中创建 Upgrade / Deploy / Incident / Decision timeline item。
4. **Completed item 默认折叠** — 前端完成项折叠展示。
5. **不创建新分支** — 直接在 main 分支上操作，除非 Boss 另行要求。
6. **不要泄露 token / secret / API key** — 文档、代码和 Point item 中不得包含敏感凭据。
7. **不要提交环境备份文件** — `.env*`、密钥、cookie、token 文件必须留在本机。

## System Upgrade Timeline

Point 是 Boss 和 agents 的共享异步 timeline，用来记录 tasks、progress、blockers、decisions、incidents、upgrades 和 deploys。

每次功能升级、bug 修复、incident 处理和部署完成后，都必须创建一条 Point timeline item。

可用 timeline 类型：

- `upgrade`: 功能升级、维护改进、计划内系统调整。UI 显示：`📦 Upgrade`。
- `deploy`: 部署事件、release note、上线验证。UI 显示：`🚀 Deploy`。
- `incident`: 故障、回归、失败部署、数据问题和恢复处理。UI 显示：`⚠️ Incident`。
- `decision`: 长期有效的产品或运维决定。UI 显示：`🧠 Decision`。

Upgrade / Deploy log 至少包含：

- Upgrade 标题
- 修改内容
- 修复内容
- 影响范围
- 风险
- commit hash
- 是否已部署

## Identity

优先使用 `xiao_blue` 写入自动化 dev 记录，除非后续新增专用 `system` API key。当前 API 的 `createdBy` 由 bearer token 映射得出，不读取 request body 中的 `createdBy`。

## Dark Mode 兼容性规则

- 所有新增 UI 必须使用 Tailwind `dark:` 变体。
- 新增颜色、背景、边框必须同时定义 dark 模式样式。
- 验证方式：切换 dark mode 后视觉无异常、功能正常。

## PWA 兼容性规则

- Service Worker 仅缓存 App Shell（HTML/CSS/JS 静态资源）。
- **不缓存 /api/* 请求** — API 请求必须 pass-through 到服务器。
- PWA 更新后需验证 Service Worker 注册和缓存策略正确。

## 团队角色分工

| 角色 | 职责 |
|------|------|
| **Boss** | 项目负责人，在 Termux Codex 上部署 Web Server，批准合并和发布 |
| **小蓝 (YaYa)** | 备忘记录 Agent，负责记录会议纪要、进展摘要、维护文档 |
| **Codex** | 开发执行 Agent，在 Dev Server 上编码、测试、commit/push |
| **Ashe** | 技术分析 Agent，负责任务拆解、技术决策、代码审查 |

## 升级验证要求

每次升级部署后，必须依次验证：

1. **Docker 容器状态**: `docker compose ps` — 确认容器 running。
2. **登录功能**: 访问应用，确认登录/认证正常。
3. **HTTP 状态**: 确认页面 200 OK，API `/api/items` 可正常响应。
4. **Dark Mode**: 切换暗色模式，确认无视觉异常。
5. **PWA**: 确认 Service Worker 注册正常，API 请求不被缓存。
6. **Timeline Log**: 创建对应 `upgrade` 或 `deploy` Point item。

如验证失败，立即按 `DEPLOY_WORKFLOW.md` 的回滚流程处理。

## DEV ONLY Guardrails

During DEV ONLY work:

- Do not clear data.
- Do not deploy web server.
- Do not rebuild production containers.
- Do not modify production configuration.
- Do not push unless Boss explicitly asks for GitHub sync.
