# @inkstack/shell

墨栈的用户入口应用，Next.js 16 App Router，默认监听 `:3000`。当前只有落地页，画布与后端服务尚未接入。

## 运行

在仓库根执行：

```bash
pnpm --filter @inkstack/shell dev        # http://localhost:3000
pnpm --filter @inkstack/shell build
pnpm --filter @inkstack/shell typecheck
pnpm --filter @inkstack/shell lint
```

## 相关文档

- 应用约定：[AGENTS.md](AGENTS.md)
- 架构与设计决策：[DESIGN-RECORD.md](../../docs/architecture/DESIGN-RECORD.md)
