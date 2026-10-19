# @inkstack/gateway

墨栈的 Gateway 服务，NestJS 12 + Node ESM，监听 `GATEWAY_PORT`（默认 `:4001`）。当前只有健康检查与 Socket.IO 的 `/ws` ping/pong；action 队列、seq、广播与持久化尚未接入。

## 运行

在仓库根执行：

```bash
pnpm --filter @inkstack/gateway dev        # http://localhost:4001
pnpm --filter @inkstack/gateway build
pnpm --filter @inkstack/gateway typecheck
pnpm --filter @inkstack/gateway lint
```

健康检查：`curl http://localhost:4001/health`

WS smoke（先启动 `dev`）：

```bash
pnpm --filter @inkstack/gateway smoke:ws
```

## 相关文档

- 应用约定：[AGENTS.md](AGENTS.md)
- 架构与设计决策：[DESIGN-RECORD.md](../../docs/architecture/DESIGN-RECORD.md)
