# Project Context — Point

## 项目简介

Point 是 AI Agent 协作平台，用于管理 Task / Progress / Decision / Upgrade Log。

- **用途**: 让多个 AI Agent（小蓝、Codex、Ashe）和 Boss 以结构化方式协作，追踪任务进度、记录决策、管理升级日志
- **使用者**: Boss（项目负责人）、小蓝 YaYa（备忘录 Agent）、Codex（开发执行 Agent）、Ashe（技术分析 Agent）

## 当前架构

```
Dev Server (1.1.1.7)  ←→  GitHub (lanlicyuen/1plabs-point)  ←→  Web Server (1.1.1.4)
     /srv/apps/1plabs-point        main branch                    /srv/apps/1plabs-point
```

- **Dev Server (1.1.1.7)**: 开发环境，所有代码修改在此进行
- **GitHub**: 唯一同步中心，所有代码通过 GitHub 协调
- **Web Server (1.1.1.4)**: 生产部署，通过 Docker Compose 容器化运行，端口映射 3002→3000

## 标准开发流程

1. **Dev Server**: 开发 → commit → push origin main（SSH key: id_ed25519_1plabs_point, host alias: github.com-1plabs-point）
2. **Web Server**: git pull origin main → docker compose up -d → health check
3. GitHub 是唯一同步中心——dev server 和 web server 之间不直接同步

## 当前技术栈

- **Framework**: Next.js + TypeScript + Tailwind CSS
- **部署**: Docker Compose（Web Server 容器化，端口 3002→3000）
- **API**: Point API (/api/items)
- **PWA**: Service Worker + App Shell only，/api/* 请求 pass-through（不缓存 API）
- **Dark Mode**: Tailwind dark: 变体实现

## 项目目标

构建一个 Agent 协作平台，核心数据模型为：

- **Task**: 待办任务，可分配给 Agent
- **Progress**: 任务进展记录
- **Decision**: 关键决策记录
- **Upgrade Log**: 每次系统升级必须记录变更内容

平台支持多人/多 Agent 协作，Completed item 默认折叠显示。

## 已完成的功能

| Feature | Commit |
|---------|--------|
| Dark Mode | df2475e |
| PWA Safe Mode | c7ce49e |
| Completed Visual State | b63409b |
| UI Refinement | 6d92dd5 |
| Collapse | ff90746 |