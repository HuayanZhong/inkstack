# @inkstack/shell

墨栈的用户入口应用，Next.js 16 App Router，监听 `PORT`（默认 `:3000`）。画布通过 Module Federation 在客户端加载；BFF / Gateway 尚未接入页面。

## 运行

在仓库根执行：

```bash
pnpm --filter @inkstack/shell dev        # http://localhost:3000
pnpm --filter @inkstack/shell build
pnpm --filter @inkstack/shell typecheck
pnpm --filter @inkstack/shell lint
```

画布由 canvas 的 MF manifest 提供：先启动 `@inkstack/canvas`；入口可用 `NEXT_PUBLIC_CANVAS_MF_ENTRY` 覆盖。

## 相关文档

- 应用约定：[AGENTS.md](AGENTS.md)
- 架构与设计决策：[DESIGN-RECORD.md](../../docs/architecture/DESIGN-RECORD.md)
