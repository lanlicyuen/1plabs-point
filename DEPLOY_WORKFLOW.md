# Deploy Workflow — Point 部署流程

## Current Architecture

- Dev server path: `/srv/apps/1plabs-point`
- Runtime container: `1plabs-point`
- Host database: `/srv/data/1plabs-point/1plabs-point.db`
- Container database: `/data/1plabs-point.db`
- Public Point API: `https://point.1plabs.pro/api`
- Docker Compose port mapping: `3002` host → `3000` container

## DEV ONLY Workflow

For dev-only changes:

1. Read project rules before editing.
2. Make code changes in `/srv/apps/1plabs-point` on Dev Server.
3. Run `npm run build`.
4. Commit to Git.
5. Push to GitHub only when Boss explicitly requests it.
6. Do not deploy web server unless Boss explicitly requests deployment.

Recommended Git commands on Dev Server:

```bash
cd /srv/apps/1plabs-point
git status
git add <changed-files-only>
git commit -m "<type>: <description>"
git push origin main
```

Do not use `git add -A` if `.env*`, keys, tokens, or local backups are present.

## Web Server Deployment Workflow

Web Server is deployed by Boss phone Termux Codex over SSH. Do not auto-deploy from dev-only tasks.

When Boss explicitly approves deployment on Web Server:

```bash
cd /srv/apps/1plabs-point
git pull origin main
docker compose up -d --build
```

## Health Check

After deployment, run:

```bash
# 1. Container status
docker compose ps
# Expected: point container running, port 3002 -> 3000

# 2. HTTP status
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/
# Expected: 200

# 3. API availability
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/items
# Expected: 200 or 401 depending auth, not 500

# 4. Browser login
# Visit the app and confirm login/auth works.
```

Also verify:

- Dark Mode has no visual regression.
- PWA service worker still registers.
- `/api/*` requests are not cached by PWA.

## Required Upgrade / Deploy Log

After every feature upgrade, bug fix, incident response, or deployment, write one Point timeline item using:

```bash
npm run upgrade:log --   --title "Short title"   --type upgrade   --changes "What changed"   --fixes "What was fixed"   --impact "Affected area"   --risk "Known risk"   --deployed "dev only / not deployed"
```

Use `--type deploy` for production deployments and set `--deployed "deployed"` after verification.

The script writes through `POST /api/items` and needs one of these env vars:

- `POINT_AGENT_API_KEY`
- `AGENT_API_KEY_SYSTEM`
- `AGENT_API_KEY_XIAO_BLUE`
- `AGENT_API_KEY`

Current auth maps bearer tokens to existing agents. If no `system` token is configured, use the `xiao_blue` token.

## Rollback Steps

If deployment fails after Boss-approved production deployment:

```bash
# 1. Inspect recent commits
git log --oneline -5

# 2. Only with explicit Boss emergency approval, reset to a stable commit
git reset --hard <stable-commit-hash>
docker compose up -d --build
```

Force push is not part of the normal rollback path. Use it only with explicit Boss emergency approval because it affects collaboration history.

After rollback, create a Point `incident` or `deploy` log with the failed commit, stable commit, impact, and recovery status.

## Notes

- Web Server 禁止直接开发，只执行 pull + deploy。
- 部署前确认 Dev Server 已 push 到 GitHub。
- 生产环境不要使用 `npm run dev`，必须用 Docker 容器。
- 数据库相关变更必须先备份 `/srv/data/1plabs-point/1plabs-point.db`。
