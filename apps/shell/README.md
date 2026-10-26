# @inkstack/shell

墨栈的用户入口应用，Next.js 16 App Router，监听 `PORT`（默认 `:3000`）。登录与注册页已提供静态样式，认证、画布与 BFF / Gateway 尚未接入。

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
