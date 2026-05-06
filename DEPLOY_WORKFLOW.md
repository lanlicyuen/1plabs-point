# Deploy Workflow — Point 部署流程

## 标准部署流程

### Dev Server (1.1.1.7:/srv/apps/1plabs-point)

```bash
# 1. 开发修改代码
# 2. 测试确认
# 3. Git 操作
git add -A
git commit -m "<type>: <description>"
git push origin main
# SSH key: id_ed25519_1plabs_point, host alias: github.com-1plabs-point
```

### Web Server (1.1.1.4:/srv/apps/1plabs-point)

```bash
# 1. 拉取最新代码
cd /srv/apps/1plabs-point
git pull origin main

# 2. 重建并启动容器
docker compose up -d --build

# 3. Health check（见下方）
```

## Health Check

部署完成后执行以下检查：

```bash
# 1. 容器状态
docker compose ps
# 期望: point 容器 running, 端口 3002→3000

# 2. HTTP 状态
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/
# 期望: 200

# 3. API 可用性
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/items
# 期望: 200 (或 401 未授权，但不应该是 500)

# 4. 登录验证
# 浏览器访问 http://1.1.1.4:3002，确认可正常登录
```

## 回滚步骤

如果部署后发现问题：

```bash
# 1. 查看最近 commit
git log --oneline -5

# 2. 回滚到上一个稳定版本
git reset --hard <stable-commit-hash>
docker compose up -d --build

# 3. 如果需要远程也回滚
git push origin main --force
# 注意: force push 影响协作，仅在紧急回滚时使用
```

## 注意事项

- Web Server 禁止直接开发，只执行 pull + deploy
- 部署前确认 Dev Server 已 push 到 GitHub
- Docker Compose 端口映射: 3002(宿主) → 3000(容器)
- 每次部署后必须完整执行 Health Check
- 生产环境不要使用 `npm run dev`，必须用 Docker 容器