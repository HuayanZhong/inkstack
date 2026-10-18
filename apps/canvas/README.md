# @inkstack/canvas

墨栈的 tldraw 画布应用，Rspack 构建，开发端口 `:4002`。通过 Module Federation 暴露 `./Canvas`，供 shell 作为 host 加载。

## 运行

在仓库根执行：

```bash
pnpm --filter @inkstack/canvas dev        # http://localhost:4002
pnpm --filter @inkstack/canvas build
pnpm --filter @inkstack/canvas typecheck
pnpm --filter @inkstack/canvas lint
```

## 暴露

- `./Canvas` → `src/Canvas.tsx`
- `shared`：`react`、`react-dom`，均声明为 `singleton`

## 相关文档

- 应用约定：[AGENTS.md](AGENTS.md)
- 架构与设计决策：[DESIGN-RECORD.md](../../docs/architecture/DESIGN-RECORD.md)
