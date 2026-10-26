# AGENTS.md

补充根文件的规则。本目录是 Next.js 16 App Router 应用，用户访问的入口外壳；端口由 `PORT` 控制。

## 职责

- 页面、布局与全局元信息。
- 不持有 action 队列，不直接调用 Gateway。

## 目录

- `env.ts`、`src/app/`：env 校验、App Router 路由、根级状态页与全局样式入口。

## 命令

在仓库根执行：`pnpm --filter @inkstack/shell dev|build|typecheck|lint|test`。

## 约束

- `env.ts` 在 `next.config.ts` 加载时校验 `PORT` 与 `ALLOWED_DEV_ORIGINS`，不要写死端口或 host。
- `tsconfig.json` 继承 `@inkstack/tsconfig/next.json`，保留 Next 生成的 `include` 与 `paths`。
- 不启用 ESLint / Prettier；`next/font/google` 构建期需要联网，不要引入。UI 组件从 `@inkstack/ui` 导入，新增组件见 [packages/ui/AGENTS.md](../../packages/ui/AGENTS.md)。
- 样式入口是 `src/app/globals.css`，只导入 `@inkstack/ui/globals.css` 并用 `@source` 扫描共享组件，不写第二份主题或色值。

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
