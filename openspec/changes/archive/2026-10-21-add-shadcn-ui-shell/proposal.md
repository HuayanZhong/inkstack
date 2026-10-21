# Proposal

## Why

shell 与 canvas 目前各自维护手写样式，没有共享的组件基础。后续产品界面需要工具栏、面板、表单与弹层等元素，两个应用各写一套会重复处理焦点管理、键盘导航与无障碍属性，也难以保持一致。仓库仍处于骨架阶段，此时建立共享 UI 包并接入两个应用，成本低于在页面变多之后回补。

## What Changes

- 新建 `packages/ui`（`@inkstack/ui`），承载 shadcn 组件、`cn` 工具与共享主题样式，按仓库约定构建到 `dist`。
- 采用 shadcn 的**现有 monorepo 模式**：`apps/shell/components.json` 与 `packages/ui/components.json` 同时存在且风格一致，从 shell 执行 `add` 时 UI 组件落到 `packages/ui`。不使用 `init --monorepo` 脚手架。
- `apps/shell` 与 `apps/canvas` 都以 Tailwind CSS v4 作为样式管线：shell 走 Next PostCSS，canvas 走 Rspack 的 `postcss-loader`。
- 主题变量集中在 `@inkstack/ui/globals.css`，两个应用只导入这一份样式入口；暗色只保留系统偏好一种机制。
- 新增依赖全部登记到 `pnpm-workspace.yaml` catalog，`package.json` 只引用 `catalog:*`；CLI 生成的裸 semver 必须回填。
- 回退单应用 init 产生的产物，包括 `apps/shell` 下的 `components.json`、`src/components/ui`、`src/lib/utils.ts`，以及违反仓库规则的 `next/font/google` 改动。
- 更新 `apps/shell/AGENTS.md`、`apps/canvas/AGENTS.md` 与新增包文档，移除相关禁令并写清消费方式。

## Capabilities

### New Capabilities

- `ui-system`: 定义 shell 与 canvas 共享的 UI 包边界、主题令牌、暗色策略、组件生成方式与样式管线。

### Modified Capabilities

无。

## Impact

- 新增 `packages/ui`：`package.json`、`tsconfig*.json`、`src/components/**`、`src/lib/utils.ts`、`styles/globals.css`、`test/**`、`AGENTS.md`、`CLAUDE.md`、`README.md`。
- `apps/shell`：`package.json`、`components.json`、`postcss.config.mjs`、`src/app/globals.css`、`src/app/layout.tsx`、`AGENTS.md`。
- `apps/canvas`：`package.json`、`postcss.config.mjs`、`src/index.css`、`AGENTS.md`。
- 仓库根：`pnpm-workspace.yaml`（catalog 条目）、`pnpm-lock.yaml`。
- 不修改 `apps/gateway`、`apps/bff` 与现有 `packages/*`。
- 不引入主题切换 UI 或 `next-themes`。
