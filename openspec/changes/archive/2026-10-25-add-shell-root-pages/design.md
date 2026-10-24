# Design

## Context

- shell 当前只有 `layout.tsx`、空 `page.tsx` 与 `favicon.ico`；`globals.css`、`page.module.css`、`canvas-host.tsx` 已在 `7a97c82` 删除，`@inkstack/ui` 依赖也一并移除。`postcss.config.mjs` 仍在，但没有 CSS 入口消费它。
- 实际安装的是 Next.js `16.4.2`。该版本中 `error.tsx` 的用户重试入口是 `retry`（`v16.3.0` 起稳定），`reset` 仍存在但只清状态、不重新取数；`global-error.tsx` 会替换根布局，必须自带 `html`/`body`，且不会自动带入全局样式。
- `next.config.ts` 开启 `cacheComponents: true` 与 `partialPrefetching: true`；根布局不取数，当前不受 Cache Components 的 Suspense 约束影响。
- `packages/ui` 已导出 `Button`、`buttonVariants`、`ModeToggle`、`ThemeProvider` 与 `globals.css`；`ui-system` 规格要求暗色只跟随系统，不存在 `.dark` 类路径。`ModeToggle` 的 `setTheme` 与这条规格冲突，当前也没有挂载 Provider，本设计不处理它。
- 根布局使用 Next 生成的全局类型 `LayoutProps<'/'>`；`lint` 与 `typecheck` 脚本已先执行 `next typegen`。

## Goals / Non-Goals

**Goals:**

- 让 shell 的每个路由都从同一份共享样式入口获得主题与工具类。
- 用最小页面集覆盖 `/`、未匹配 URL、路由错误、根布局错误与加载状态，并让这些页面在无后端时也能渲染。
- 用共享组件与主题令牌实现页面，避免产生第二套按钮或色值。
- 为新页面补可运行的组件测试，移除“没有测试也算通过”的开关。

**Non-Goals:**

- 不做登录页、画布页或任何路由组内的页面；`(auth)` 与 `(canvas)` 继续为空，后续变更再决定分组布局。
- 不恢复 canvas 的 Module Federation consumer，也不解决 `shell-canvas-consumer` 的规格漂移。
- 不引入 `ThemeProvider` 或手动主题切换；不修改 `packages/ui`。
- 不新增 `template.tsx`、`global-not-found.tsx`、`forbidden.tsx`、`unauthorized.tsx`、`route.ts`、`sitemap.ts`、`robots.ts` 或图标文件。
- 不引入新的 shadcn 组件；现有 `Button` 与 `buttonVariants` 足够。

## Decisions

### 1. 样式入口放在 `apps/shell/src/app/globals.css`

该文件只做三件事：导入 `@inkstack/ui/globals.css`、用 `@source '../../../../packages/ui/src'` 声明共享组件的扫描来源、补充 shell 的全局布局规则。根布局导入它一次。

备选是让 `postcss.config.mjs` 的 `base` 指向仓库根。已有注释说明这会扩大 dev 的文件监听范围，别的应用写产物时触发重建，因此不采用。备选是每个页面写 CSS Module；这会绕开共享主题，也不满足 `ui-system` 的单一入口要求。

### 2. 根页面保持服务端静态渲染，不制造假入口

`page.tsx` 继续是 Server Component，不取数、不读 env、不引用 canvas 或 BFF。内容限定为产品名、口号、三项产品能力与阶段说明；不放置指向 `/login`、`/canvas` 等未实现路由的链接或禁用按钮，避免用户点进 404。

视觉方向是克制的排版型入口：单列、最大宽度约 3rem 级别的标题、`text-muted-foreground` 的辅助文本、`border-border` 与 `bg-card` 的能力卡片，不引入图片、渐变或自定义字体。所有颜色走语义令牌。

### 3. 状态页使用 Next 16 的约定，不自行造边界

- `not-found.tsx` 是 Server Component，根级文件同时接管全站未匹配 URL；提供 `Link` 回首页。
- `error.tsx` 是 Client Component，使用 `{ error, retry }` 中的 `retry()`，不展示 `error.message` 或堆栈；固定文案 + 重试 + 返回首页。
- `global-error.tsx` 是 Client Component，自带 `<html lang="zh-CN">` 与 `<body>`，并显式 `import './globals.css'`，否则替换根布局后没有主题令牌。
- `loading.tsx` 是 Server Component，使用 `role="status"` 与可见的“正在加载”文本；它只在片段挂起时出现，静态首页不会触发。

备选是用自定义 React Error Boundary 包住页面；这需要在每个布局重复挂载，且无法覆盖根布局自身错误，因此交给约定文件。

### 4. 根布局只做文档与样式接入

保留现有 `metadata`，补 `import './globals.css'` 与 `body` 的基础类名；不添加导航、顶栏或 Provider。导航需要真实路由，等登录页与画布页落地后再加，避免现在做一个只有死链接的壳。

### 5. 主题维持“仅系统偏好”

不挂 `ThemeProvider`，不使用 `ModeToggle`。这样与 `ui-system` 规格和现有 `globals.css` 的 `@media (prefers-color-scheme: dark)` 保持一致。`ModeToggle` 与规格的冲突、以及是否需要手动切换，留给单独变更决定；本变更不扩大范围。

### 6. 依赖通过 pnpm 加入，测试沿用现有 React 预设

- 在仓库根执行 `pnpm add --filter @inkstack/shell @inkstack/ui --workspace`，使清单出现 `workspace:*`；若 pnpm 写成 `workspace:^`，用 `save-workspace-protocol=*` 统一，不手改版本。
- 测试沿用 `@inkstack/vitest-config` 的 React 预设与 `apps/shell/test/setup.ts`。新增 `test/app/` 下的 RTL 测试：入口页标题与阶段文案、404 文案与回首页链接、error 的 retry 回调、loading 的 `role="status"`、global-error 的文案与重试。渲染 `next/link` 的测试用 `vi.mock` 替换为普通 `<a>`，避免在测试环境里依赖 App Router 上下文。
- 覆盖率 include 仍是 `src/**/*.tsx`；从 exclude 中移除 `page.tsx`（现在有内容可测），保留 `layout.tsx`（文档级布局，无独立行为）。删除 `passWithNoTests: true`，因为本次起不再允许“零测试通过”。

## Risks / Trade-offs

- [global-error 导入全局 CSS 在某些构建模式被拒绝] → 先用 `pnpm --filter @inkstack/shell build` 验证；若失败，改为在 `global-error.tsx` 内用 `<style>` 声明与系统偏好一致的最小令牌，并在注释中说明原因。
- [Tailwind 扫描不到 `packages/ui/src`，共享按钮没有样式] → 构建后检查 shell 产物 CSS 是否包含 Button 使用的类名；失败时确认 `@source` 相对路径并对比 canvas 的 `index.css` 写法。
- [`loading.tsx` 在 Cache Components 下的行为与普通 Suspense 不同] → 组件测试直接渲染 loading 文件，不把“生产导航必然出现加载态”作为断言；集成验证只确认构建与手动访问不报错。
- [global-error 的 `html`/`body` 在 jsdom 中嵌套渲染可能告警] → 测试只断言可见文案与重试按钮；若 jsdom 无法稳定渲染文档标签，把 global-error 加入覆盖排除并在 tasks 中记录原因。
- [新增页面拉低覆盖率] → 每个状态页都有对应测试；纯文档级的 `layout.tsx` 继续排除，避免用无行为代码换覆盖率。
- [根页面文案承诺了尚未实现的能力] → 文案描述产品定位而非“已可用”，并保留“登录/画布入口搭建中”的阶段说明；后续页面落地时再替换。

## Migration Plan

无数据迁移。实现顺序为：加依赖 → 恢复样式入口 → 改根页面与根布局 → 加四个状态页 → 补测试与覆盖率配置 → 全量验证。回滚只需回退本次提交；不涉及数据库、部署或外部契约。

## Open Questions

- 根页面未来是保留为产品 landing，还是在登录页落地后改为重定向或工作台入口？这不改变本次的页面契约，留给后续变更决定。
- `(auth)` 与 `(canvas)` 两个空路由组是否需要各自的 `layout.tsx`？等各自页面出现时再定。
