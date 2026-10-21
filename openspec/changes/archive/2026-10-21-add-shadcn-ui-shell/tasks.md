# Tasks

## 1. 准备与回退

- [x] 1.1 shell 安装 `tailwindcss` 与 `@tailwindcss/postcss`，创建 `postcss.config.mjs`，确认 `pnpm check:manifests` 通过
- [x] 1.2 删除 `apps/shell/components.json`、`apps/shell/src/components/ui`、`apps/shell/src/lib/utils.ts`，回退 `layout.tsx` 的 Geist 改动，确认仓库中不存在 `next/font/google`
- [x] 1.3 删除 shell `globals.css` 中的单应用主题变量、Tailwind 导入与 `@custom-variant dark`，只保留布局规则，确认文件不再包含 `.dark`

## 2. 共享 UI 包

- [x] 2.1 创建 `packages/ui` 的 `package.json`、`tsconfig.json`、`tsconfig.build.json`、`AGENTS.md`、`CLAUDE.md`、`README.md`，确认 `pnpm check:manifests` 只报缺少测试与依赖的预期错误
- [x] 2.2 用 `pnpm add` 把运行时与开发依赖加入 catalog 并写入 `packages/ui/package.json`，确认 `pnpm check:manifests` 通过
- [x] 2.3 创建 `packages/ui/styles/globals.css`：Tailwind 与 shadcn 导入、亮色与系统暗色令牌、`@theme inline`、`@layer base`；扫描范围由应用 PostCSS 的 `base` 指向仓库根；确认文件中不存在 `.dark` 选择器
- [x] 2.4 创建 `src/components/button.tsx`、`src/lib/utils.ts`、`src/index.ts`，执行 `pnpm --filter @inkstack/ui build`，确认 `dist` 产出组件、工具与声明文件，且 `node -e "import('./packages/ui/dist/index.js')"` 成功
- [x] 2.5 创建 `test/components/button.test.tsx` 与 `vitest.config.ts`，确认 `pnpm --filter @inkstack/ui test:coverage` 通过且达到 80/70 门槛
- [x] 2.6 执行 `pnpm --filter @inkstack/ui publint`，确认导出映射全部可解析

## 3. shell 接入

- [x] 3.1 创建 `apps/shell/components.json`：monorepo 别名指向 `@inkstack/ui/*`，`tailwind.css` 指向 `../../packages/ui/styles/globals.css`，与共享包配置的 style / iconLibrary / baseColor 一致
- [x] 3.2 把 `apps/shell/src/app/globals.css` 改为 `@import "@inkstack/ui/globals.css";` 加现有布局规则；`layout.tsx` 保持原生字体；确认 `pnpm --filter @inkstack/shell typecheck` 通过
- [x] 3.3 在 shell `package.json` 增加 `@inkstack/ui` 并移除迁走的 UI 运行时依赖，确认 `pnpm check:manifests` 通过
- [x] 3.4 启动 shell，确认页面渲染正常且共享样式生效

## 4. canvas 接入

- [x] 4.1 在 canvas `package.json` 增加 `@inkstack/ui`、`@tailwindcss/postcss`，创建 `postcss.config.mjs`，确认 `pnpm check:manifests` 通过
- [x] 4.2 在 `apps/canvas/src/index.css` 导入 `@inkstack/ui/globals.css`，执行 `pnpm --filter @inkstack/canvas build`，确认产物 CSS 包含共享组件的类名
- [x] 4.3 执行 `pnpm --filter @inkstack/canvas typecheck`，确认通过

## 5. 依赖归一化

- [x] 5.1 确认 `pnpm-workspace.yaml` 的 `runtime` / `dev` catalog 包含全部新增依赖，且所有清单只使用 `catalog:*`
- [x] 5.2 执行 `pnpm install --frozen-lockfile` 与 `pnpm check:manifests`，确认两者通过

## 6. 文档

- [x] 6.1 更新 `apps/shell/AGENTS.md`：移除 Tailwind 禁令，写清共享样式入口与组件生成命令，确认 ≤25 行
- [x] 6.2 更新 `apps/canvas/AGENTS.md`：补充 Tailwind/PostCSS 与 `@inkstack/ui` 消费约束，确认 ≤25 行
- [x] 6.3 确认 `packages/ui/README.md` 写明职责、公开导出、构建命令与消费方式

## 7. 集成验证

- [x] 7.1 依次执行 `pnpm format`、`pnpm format:check`、`pnpm lint`、`pnpm check:manifests`、`pnpm typecheck`、`pnpm test`，确认全部通过
- [x] 7.2 执行 `pnpm build`，确认 shell、canvas 与共享包都构建成功
- [x] 7.3 同时启动 canvas 与 shell，确认共享按钮渲染、暗色跟随系统，且 tldraw 工具栏、菜单与交互无视觉回归
- [x] 7.4 执行 `pnpm dlx shadcn@latest add --dry-run badge -c apps/shell`，确认生成目标为 `packages/ui/src/components` 而不是 `dist`

## Workflow follow-up

- 变更评审通过后归档该 change，并确认归档后的 `specs/ui-system/spec.md` 内容完整。
