# AGENTS.md

补充根文件的规则。本目录是 Next.js 16 App Router 应用，用户访问的入口外壳。

## 职责

- 页面、布局与全局元信息。
- 后续用 iframe 承载 `apps/canvas`，不直接操作 tldraw editor。
- 不持有 action 队列，不直接调用 Gateway。

## 目录

- `src/app/`：App Router 路由、`layout.tsx`、`page.tsx` 与全局样式。
- `public/`：静态资源，当前沿用模板示例文件。

## 命令

在仓库根执行：

```bash
pnpm --filter @inkstack/shell dev   # :3000
pnpm --filter @inkstack/shell build
pnpm --filter @inkstack/shell typecheck
pnpm --filter @inkstack/shell lint
```

## 约束

- 依赖只通过 `catalog:` 引用；新增运行时依赖先进 `runtime` catalog。
- `tsconfig.json` 继承 `@inkstack/tsconfig/next.json`，保留 Next 生成的 `include` 与 `paths`；Next 会校验并改写它，以它写回的值为准。
- 不启用 ESLint / Tailwind / Prettier，格式与 lint 由根 oxlint / oxfmt 负责。
- `next/font/google` 构建期需要联网，不要在应用里引入。

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
