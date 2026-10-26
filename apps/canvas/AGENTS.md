# AGENTS.md

补充根文件的规则。本目录是 tldraw 画布应用，Rspack 构建，开发端口由 `CANVAS_PORT` 控制（默认 `:4002`）。

## 职责

- 渲染 tldraw 画布，是所有画布 action 的唯一执行者；不直接写 design.json，不持有 action 队列。
- 通过 MF 暴露 `./Canvas`；shell 的消费端尚未接入。

## 目录

- `src/Canvas.tsx`：画布组件，独立页面与 remote 共用。
- `src/App.tsx`、`src/index.ts`：独立页面入口；异步初始化由 MF 插件负责。
- `module-federation.config.ts`、`rspack.config.ts`、`src/config/env.ts`：remote、构建与 env 校验。

## 命令

在仓库根执行：`pnpm --filter @inkstack/canvas dev|build|typecheck|lint|test`。

## 约束

- `@module-federation/enhanced` 用 `catalog:runtime`。样式入口 `src/index.css` 导入 `@inkstack/ui/globals.css`，`postcss.config.mjs` 固定 `@tailwindcss/postcss`；UI 组件从 `@inkstack/ui` 导入，不复制到应用。
- React 必须保持单例；`react-dom/client` 子路径也必须共享，否则 remote 会加载自带副本。
- dev 的 `publicPath` 由 `CANVAS_HOST` / `CANVAS_PORT` 生成，production 用 `auto`；dev server 的 CORS 由 `CANVAS_DEV_CORS_ORIGIN` 控制。
- 不要改回 `src/index.ts` 的手写异步边界。全局样式与 tldraw 同文档，调整 Tailwind 或共享主题后需回归画布交互。
