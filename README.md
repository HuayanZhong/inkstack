# 墨栈 Inkstack

> 让 AI 落笔，让代码落地。

AI design-to-code 画布：支持 AI 控笔、人工编辑、设计转代码，并通过 MCP 暴露给外部 Agent。

## 目录

```
apps/
  shell/       Next.js Shell
  canvas/      tldraw 画布
  gateway/     NestJS Gateway
  bff/         BFF（框架待定，占位）
packages/
  contracts/   共享类型 / 协议 / codegen IR
  config/      共享 tsconfig / lint 配置
docs/
  architecture/  架构图与设计记录
infra/
  docker/ k8s/ compose/ observability/  部署与可观测性配置
```

包统一使用 `@inkstack/*` 命名。

## 开发

要求 Node `>=24.14.1`、pnpm `12.14.0`。

```bash
pnpm install
pnpm dev
```

> 当前为骨架阶段：各包只有 `package.json`，尚无 `dev` / `build` 等脚本，
> 运行对应命令会提示没有可执行任务。工具链随后按里程碑逐步接入。

## 文档

- [架构总览](docs/architecture/README.md)
- [设计记录](docs/architecture/DESIGN-RECORD.md)
