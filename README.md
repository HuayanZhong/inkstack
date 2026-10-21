# 墨栈 Inkstack

> 让 AI 落笔，让代码落地。

[![CI](https://github.com/HuayanZhong/inkstack/actions/workflows/ci-master.yml/badge.svg)](https://github.com/HuayanZhong/inkstack/actions/workflows/ci-master.yml)

AI design-to-code 画布：支持 AI 控笔、人工编辑、设计转代码，并通过 MCP 暴露给外部 Agent。

## 目录

```
apps/
  shell/       Next.js Shell
  canvas/      tldraw 画布
  gateway/     NestJS Gateway
  bff/         BFF（NestJS）
packages/
  config/      共享配置解析与 URL 标准化
  contracts/   共享类型 / 协议 / codegen IR
  tsconfig/    共享 tsconfig 预设
  ui/          共享 shadcn 组件与 Tailwind 主题
  vitest-config/  共享 Vitest 预设
docs/
  architecture/  架构图与设计记录
openspec/        OpenSpec 规格与变更
.github/         CI、Dependabot 与 PR 模板
.agents/skills/  共享技能（.claude/skills 符号链接到这里）
infra/
  docker/ k8s/ compose/ observability/  部署与可观测性配置
```

包统一使用 `@inkstack/*` 命名。

## 开发

要求 Node `>=26.12.0`、pnpm `12.14.0`。

```bash
pnpm install
pnpm dev
```

> 当前为骨架阶段：`apps/shell`、`apps/bff`、`apps/canvas`、`apps/gateway` 已能启动与构建。
> `pnpm dev` 会拉起 shell（默认 <http://localhost:3000>）、bff（默认 <http://localhost:4003>）、
> canvas（默认 <http://localhost:4002>）、gateway（默认 <http://localhost:4001>）与 contracts / config 的监听任务；
> gateway 当前只有健康检查与 `/ws` ping/pong，action 协议尚未接入。

PR 与 `main` push 会执行与 `pnpm verify` 等价的 CI；依赖更新由 Dependabot 每日巡检。完整蓝图见 [docs/ci-cd.md](docs/ci-cd.md)，目录约束见 [.github/AGENTS.md](.github/AGENTS.md)。

首次启用时，在仓库 Settings → Code security 打开 Dependabot alerts 与 security updates，并把 `all checks passed` 设为 `main` 的 required check。

## 环境变量

首次使用复制模板：`cp .env.example .env`。应用 scripts 通过 `dotenv-cli` 按
`.env.local → .env.<mode> → .env` 加载；变量命名与新增流程见
[`.claude/rules/env.md`](.claude/rules/env.md)。

## 文档

- [架构总览](docs/architecture/README.md)
- [设计记录](docs/architecture/DESIGN-RECORD.md)
- [工具链与 CI](docs/toolchain.md)
- [CI/CD 蓝图](docs/ci-cd.md)
- [OpenSpec 规格](openspec/specs/)
