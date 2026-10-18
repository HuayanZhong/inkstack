# @inkstack/bff

墨栈的 BFF 服务，NestJS 12 + Node ESM，默认监听 `:4003`。当前只有健康检查，会话与请求聚合尚未接入。

## 运行

在仓库根执行：

```bash
pnpm --filter @inkstack/bff dev        # http://localhost:4003
pnpm --filter @inkstack/bff build
pnpm --filter @inkstack/bff typecheck
pnpm --filter @inkstack/bff lint
```

健康检查：`curl http://localhost:4003/health`

## 相关文档

- 应用约定：[AGENTS.md](AGENTS.md)
- 架构与设计决策：[DESIGN-RECORD.md](../../docs/architecture/DESIGN-RECORD.md)
