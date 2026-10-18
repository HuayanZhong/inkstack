# AGENTS.md

补充根文件的规则。本目录是 NestJS 12 的 BFF 服务，Node ESM，监听 `:4003`。

## 职责

- 面向前端的会话、SSE 与请求聚合。
- 唯一允许持有 Supabase service role 的服务端进程（后续接入）。
- 不持有 action 队列，不执行画布操作，不直接写 design.json。

## 目录

- `src/main.ts`：启动入口与端口。
- `src/app.module.ts`：模块装配。
- `nest-cli.json`、`tsconfig.build.json`：Nest 构建配置，保留 CLI 生成的结构。

## 命令

在仓库根执行：

```bash
pnpm --filter @inkstack/bff dev   # :4003
pnpm --filter @inkstack/bff build
pnpm --filter @inkstack/bff typecheck
pnpm --filter @inkstack/bff lint
```

## 约束

- 依赖只通过 `catalog:` 引用；新增运行时依赖先进 `runtime` catalog。
- `tsconfig.json` 继承 `@inkstack/tsconfig/nest.json`；装饰器与 `emitDecoratorMetadata` 依赖它，构造器注入的类不要改成 `import type`。
- 不启用 ESLint / Prettier / Vitest，格式与 lint 由根工具负责，测试尚未接入。
