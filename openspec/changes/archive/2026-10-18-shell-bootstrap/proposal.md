# Proposal

## Why

工具链（Turbo、oxlint / oxfmt、tsconfig 预设、husky）已经接通，但四个应用只有占位 `package.json`，"这套配置真的能构建出一个 Next 应用"从未被验证。先让 `apps/shell` 能启动，用最小代价暴露 Next 16 + TypeScript 6 + Node 26 + Turborepo 的组合问题，再逐个补齐其余应用。

## What Changes

- 用 `create-next-app` 16.4.2 生成 `apps/shell` 骨架：App Router、TypeScript、`src/` 目录、关闭 ESLint 与 Tailwind、跳过依赖安装与 git 初始化；生成物并入现有占位目录，仓库里不保留临时脚手架。
- 应用在 `:3000` 启动，`pnpm dev` 可从仓库根一次拉起。
- 首屏替换为产品信息页，移除模板品牌内容、示例静态资源，以及 `next/font/google` 的 Geist 字体（构建期需要联网）。
- 补齐 `dev` / `build` / `lint` / `typecheck` 四个 scripts；`tsconfig.json` 继承 `@inkstack/tsconfig/next.json`。
- `runtime` catalog 首次加入 `next`、`react`、`react-dom`；`dev` catalog 加入 `@types/react`、`@types/react-dom`。
- 新增 `apps/shell/AGENTS.md` 与只写 `@AGENTS.md` 的 `CLAUDE.md`；更新根 `README.md` 中已过时的骨架说明。

**BREAKING**：无。

不在本次范围：canvas、gateway、bff 三个应用；iframe 集成；`@inkstack/contracts` 消费；鉴权、数据库、AI 能力。

## Capabilities

### New Capabilities

无。本次只让首个应用达到「能启动」，不产生需要长期维护的行为契约；`.openspec.yaml` 已声明 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- **代码**：`apps/shell/**` 首次出现源码；`README.md` 的骨架阶段段落重写。
- **依赖**：`next@16.4.2`、`react@19.3.0`、`react-dom@19.3.0` 首次进入 `runtime` catalog。
- **构建**：`turbo run build` 首次产出 `.next`；`pnpm dev` 首次有可执行任务。
- **配置**：预计调整 `pnpm-workspace.yaml` 的 catalog，可能需要 `allowBuilds`；`.oxlintrc.json` 中 `apps/shell` 的 browser / nextjs override 已存在，本次不改。
