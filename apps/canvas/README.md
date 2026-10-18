# @inkstack/canvas

墨栈的 tldraw 画布应用，Rspack 构建，开发端口由 `CANVAS_PORT` 控制（默认 `:4002`）。作为 Module Federation provider 暴露 `./Canvas`，由 shell 以 runtime consumer 加载。

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
- `shared`：`react`、`react-dom`、`react-dom/client`，均为 `singleton`；`tldraw` 不共享
- 构建产物：`remoteEntry.js`、`mf-manifest.json`、`@mf-types.zip`

## 相关文档

- 应用约定：[AGENTS.md](AGENTS.md)
- 架构与设计决策：[DESIGN-RECORD.md](../../docs/architecture/DESIGN-RECORD.md)
