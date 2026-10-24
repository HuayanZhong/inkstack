# Tasks

## 1. 依赖与样式入口

- [x] 1.1 在仓库根执行 `pnpm add --filter @inkstack/shell @inkstack/ui --workspace`；确认 `apps/shell/package.json` 中为 `"@inkstack/ui": "workspace:*"`，并运行 `pnpm check:manifests` 通过。
- [x] 1.2 新建 `apps/shell/src/app/globals.css`：写入 `@import '@inkstack/ui/globals.css';` 与 `@source '../../../../packages/ui/src';`；在 `apps/shell/src/app/layout.tsx` 引入该文件并给 `body` 补 `min-h-dvh antialiased`；确认 `pnpm --filter @inkstack/shell build` 成功，且 `apps/shell/.next` 的产物 CSS 含 `bg-primary` 等共享 Button 类名。
- [x] 1.3 更新 `apps/shell/AGENTS.md`：目录补 `src/app/globals.css` 与根状态页，约束补“样式入口只导入共享样式，不写第二份主题”；运行 `pnpm check:docs` 通过。

## 2. 根入口页

- [x] 2.1 改写 `apps/shell/src/app/page.tsx` 为静态入口页：产品名、口号、三项产品能力与阶段说明；不链接未实现路由、不取数、不读 env；确认 `pnpm --filter @inkstack/shell typecheck` 通过。
- [x] 2.2 新增 `apps/shell/test/app/page.test.tsx`：断言“墨栈 Inkstack”、口号与阶段说明，并断言页面不存在指向 `/login`、`/canvas` 等未实现路由的链接；运行 `pnpm --filter @inkstack/shell test` 通过。
- [x] 2.3 调整 `apps/shell/vitest.config.ts`：删除 `passWithNoTests: true`，从覆盖率 exclude 移除 `src/app/page.tsx`，保留 `src/app/layout.tsx`；运行 `pnpm --filter @inkstack/shell test:coverage`，确认达到仓库默认的 80/70 门槛。

## 3. 全局状态页

- [x] 3.1 新增 `apps/shell/src/app/not-found.tsx`（Server Component，404 文案与返回首页链接）和 `apps/shell/test/app/not-found.test.tsx`（mock `next/link`，断言文案与链接）；运行 `pnpm --filter @inkstack/shell test` 通过。
- [x] 3.2 新增 `apps/shell/src/app/error.tsx`（`'use client'`，使用 `retry`，固定文案与重试/返回首页，不展示 `error.message`）和测试：点击重试调用 `retry`，且页面不出现原始错误消息；运行测试通过。
- [x] 3.3 新增 `apps/shell/src/app/global-error.tsx`（`'use client'`，自带 `html`/`body`，`import './globals.css'`，固定文案与重试）和测试：断言文案与重试；若 jsdom 无法渲染文档标签，按 design.md 记录原因并调整覆盖率排除；运行 `pnpm --filter @inkstack/shell test:coverage` 通过。
- [x] 3.4 新增 `apps/shell/src/app/loading.tsx`（`role="status"` 与可见的“正在加载”文本）和测试：断言状态角色与文本；运行 `pnpm --filter @inkstack/shell test` 通过。
- [x] 3.5 启动 `pnpm --filter @inkstack/shell dev`，访问 `/not-a-real-page`，确认 404 页面出现且“返回首页”可回到 `/`；切换系统暗色，确认首页与 404 使用暗色令牌。

## 4. 集成验证

- [x] 4.1 在仓库根执行 `pnpm format` 后运行 `pnpm verify`，确认 lint、manifest、docs、typecheck、coverage、build、format 与 hygiene 全部通过，并记录实际输出。
- [x] 4.2 启动 `pnpm dev`，确认 `/` 有内容且浏览器控制台无 hydration 错误；在开发环境临时触发一次渲染错误（验证后移除、不提交），确认 error 页的“重试”可恢复。
- [x] 4.3 确认本次未修改 `packages/ui`、`apps/canvas`、`apps/bff`、`apps/gateway` 与 `openspec/specs/` 主规格；运行 `git status --short` 只出现本变更预期的文件。

## Workflow follow-up

- 变更评审通过并完成 `pnpm verify` 后归档该 change，确认归档后生成 `openspec/specs/shell-pages/spec.md`。
- 登录页或画布页落地时，再决定 `(auth)`、`(canvas)` 是否需要各自的 layout，以及是否引入手动主题切换。
