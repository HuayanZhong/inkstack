# Proposal

## Why

shell 是墨栈的用户入口，但上一次重构之后只剩一个渲染空片段的首页和只输出 `html/body` 的根布局：样式入口、共享 UI 依赖和路由级状态页都不存在。任何后续页面（登录、画布、工作台）都会被迫先重复解决主题、404、错误与加载状态。现在先把应用根目录补齐，让 shell 成为一个可以继续承载页面的壳。

## What Changes

- 恢复 shell 的共享样式入口：新增 `apps/shell/src/app/globals.css`，导入 `@inkstack/ui/globals.css`，并用 `@source` 把 `packages/ui/src` 纳入类名扫描；在根布局中引入。
- 为 shell 增加 `@inkstack/ui` 依赖，根页面与状态页只使用共享组件和语义化主题令牌，不复制组件、不硬编码颜色。
- 把 `/` 从空片段改成可见的入口页：展示产品名、口号、三项产品能力与“登录/画布入口搭建中”的当前状态；不做指向不存在路由的跳转，不接数据。
- 新增根级 `not-found.tsx`：接管全站未匹配 URL，展示 404 文案与返回首页入口。
- 新增根级 `error.tsx`：客户端错误边界，展示固定错误文案与“重试”按钮，使用 Next 16.3+ 的 `retry` prop。
- 新增根级 `global-error.tsx`：自带 `html/body` 与共享样式导入，覆盖根布局错误，同样提供重试。
- 新增根级 `loading.tsx`：轻量加载态，作为后续异步页面的 Suspense fallback。
- 补测试并移除 `passWithNoTests`：覆盖入口页、404、error 的 retry、loading 与 global-error 的渲染；根布局继续排除在覆盖率之外。
- **不做**：`template.tsx`、`global-not-found.tsx`、`forbidden.tsx`、`unauthorized.tsx`、`route.ts`、`sitemap.ts`、`robots.ts`、`icon`/`apple-icon`。
- **不做**：新增登录页、画布页或任何路由组页面；不改动 `packages/ui` 的主题机制；不接 BFF/Gateway；不恢复 canvas 的 Module Federation consumer。

## Capabilities

### New Capabilities

- `shell-pages`: 定义 shell 根页面、根布局的样式接入，以及 404、路由错误、根布局错误与加载状态页面的行为契约。

### Modified Capabilities

无。

## Impact

- `apps/shell`：新增 `src/app/globals.css`、`src/app/not-found.tsx`、`src/app/error.tsx`、`src/app/global-error.tsx`、`src/app/loading.tsx`；修改 `src/app/layout.tsx`、`src/app/page.tsx`、`package.json`、`vitest.config.ts`；新增 `test/app/**`。
- 依赖：`@inkstack/ui` 以 `workspace:*` 进入 shell 的 dependencies；`pnpm-lock.yaml` 随安装更新。
- 不修改 `packages/ui`。`ModeToggle` 与 `ui-system` 规格“暗色仅跟随系统”的冲突不在本次范围，留待单独变更处理。
- 不修改 `apps/canvas`、`apps/bff`、`apps/gateway`。`shell-canvas-consumer` 的规格与代码漂移不在本次范围。
- 可见行为：访问 `/` 不再空白；未匹配 URL 出现品牌化 404；渲染错误出现可重试的错误页；异步路由首次导航可显示加载态。
