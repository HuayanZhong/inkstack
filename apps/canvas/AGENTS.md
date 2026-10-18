# AGENTS.md

补充根文件的规则。本目录是 tldraw 画布应用，Rspack 构建，开发端口 `:4002`。

## 职责

- 渲染 tldraw 画布，是所有画布 action 的唯一执行者。
- 通过 MF 暴露 `./Canvas`，供 shell 以 runtime consumer 加载。
- 不直接写 design.json，不持有 action 队列。

## 目录

- `src/Canvas.tsx`：画布组件，独立页面与 remote 共用。
- `src/App.tsx`、`src/index.ts`：独立页面入口；异步初始化由 MF 插件负责。
- `module-federation.config.ts`：remote 名称、exposes、shared、manifest、dts、asyncStartup。
- `rspack.config.ts`：构建、输出目录、publicPath 与 dev server CORS。

## 命令

在仓库根执行：`pnpm --filter @inkstack/canvas dev|build|typecheck|lint`。

## 约束

- 依赖只通过 `catalog:` 引用；`@module-federation/enhanced` 用 `catalog:runtime`。
- React 必须保持单例；`react-dom/client` 子路径也必须共享，否则 remote 会加载自带副本。
- `publicPath` 只在 dev 写死 `:4002`，production 用 `auto`；`:4002` 必须返回 CORS 头。
- 不要改回 `src/index.ts` 的手写异步边界。
