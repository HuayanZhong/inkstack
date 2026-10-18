# 墨栈 Inkstack

> 让 AI 落笔，让代码落地。

AI design-to-code 画布：支持 AI 控笔、人工编辑、设计转代码，并通过 MCP 暴露给外部 Agent。

## 目录

```
apps/
  shell/       Next.js Shell
  canvas/      tldraw 画布
  gateway/     NestJS Gateway
  bff/         BFF（NestJS，占位）
packages/
  contracts/   共享类型 / 协议 / codegen IR
  tsconfig/    共享 tsconfig 预设
docs/
  architecture/  架构图与设计记录
openspec/        OpenSpec 规格与变更
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

> 当前为骨架阶段：各包只有 `package.json`，尚无 `dev` / `build` 等脚本，
> 运行对应命令会提示没有可执行任务。工具链随后按里程碑逐步接入。
> 首个应用落地后重写本节。

## 文档

- [架构总览](docs/architecture/README.md)
- [设计记录](docs/architecture/DESIGN-RECORD.md)
