# Tasks

## 1. 共享表单组件

- [x] 1.1 在仓库根执行 shadcn CLI 生成 `input` 与 `label` 组件，确认生成物写入 `packages/ui/src/components`；不引入 `field` 组合。验证：两个组件文件存在，`components.json` 的应用别名未被改动。
- [x] 1.2 在 `packages/ui/src/index.ts` 导出 `Input` 与 `Label`；验证：`pnpm --filter @inkstack/ui typecheck` 通过。
- [x] 1.3 为 `Input` 与 `Label` 新增 `packages/ui/test/components/*.test.tsx`，覆盖 `type`、可访问标签关联与禁用状态；验证：`pnpm --filter @inkstack/ui test` 通过且覆盖率不低于包门槛。
- [x] 1.4 构建 UI 包供 shell 消费；验证：`pnpm --filter @inkstack/ui build` 成功，`dist` 中存在新增组件产物。

## 2. 认证页共享外壳

- [x] 2.1 新增 `apps/shell/src/app/(auth)/layout.tsx`，实现书页分栏：左书脊 + 右版心、品牌头、书脊线、分隔线与 `children`；移动端上下堆叠，书脊向网格渐隐，表单用圆角卡片突出，只使用现有主题令牌。验证：`pnpm --filter @inkstack/shell typecheck` 通过，文件中不存在硬编码十六进制或 `rgb()` 色值。
- [x] 2.2 新增 `apps/shell/test/app/(auth)/layout.test.tsx`，断言品牌文字与子内容渲染；验证：`pnpm --filter @inkstack/shell test` 通过。
- [x] 2.3 将 React Bits CursorGrid 转为 TSX，放到 `apps/shell/src/components/react-bits/cursor-grid/`（含 CSS 与 README），补齐 WebGL/浏览器 API 类型与守卫；验证：`pnpm --filter @inkstack/shell typecheck` 与 lint 通过。
- [x] 2.4 新增 `apps/shell/src/components/auth/auth-cursor-grid.tsx`，读取系统亮暗与 `--muted-foreground` / `--seal`，传入 `lightMode` 与 dashed 网格参数，在认证布局中用半透明面板叠加网格；验证：320 / 1280 截图可见网格且无横向滚动。
- [x] 2.5 为适配层补测试，并在 `apps/shell/vitest.config.ts` 写明 `cursor-grid.tsx` 的覆盖率排除理由；验证：`pnpm --filter @inkstack/shell test` 通过。
- [x] 2.6 在 `packages/ui/styles/globals.css` 增加 `.dark` / `.light` 令牌与媒体回退，并在 shell 根布局接入 `ThemeProvider`；验证：shell 与 canvas 构建通过。
- [x] 2.7 在认证页右上角加入共享 `ModeToggle`，验证亮色 / 暗色 / 跟随系统切换、持久化与 CursorGrid 同步；验证：截图与 `pnpm --filter @inkstack/shell typecheck` 通过。

## 3. 登录页

- [x] 3.1 新增 `apps/shell/src/app/(auth)/login/page.tsx`，声明 `metadata.title = '登录'`，使用共享 `Label`、`Input`、`Button` 渲染邮箱、密码、禁用登录按钮、阶段说明与注册链接；不覆盖组件样式。验证：`pnpm --filter @inkstack/shell typecheck` 通过。
- [x] 3.2 新增 `apps/shell/test/app/(auth)/login/page.test.tsx`，覆盖标题、邮箱/密码的 `type` 与 `autocomplete`、禁用按钮、阶段说明、指向 `/register` 的链接、无其他未实现链接与 metadata 标题；验证：测试通过。

## 4. 注册页

- [x] 4.1 新增 `apps/shell/src/app/(auth)/register/page.tsx`，声明 `metadata.title = '注册'`，使用共享 `Label`、`Input`、`Button` 渲染邮箱、密码、禁用注册按钮、阶段说明与登录链接；不设确认密码，不覆盖组件样式。验证：`pnpm --filter @inkstack/shell typecheck` 通过。
- [x] 4.2 新增 `apps/shell/test/app/(auth)/register/page.test.tsx`，覆盖两个字段的 `type` 与 `autocomplete`、不存在确认密码字段、禁用按钮、阶段说明、指向 `/login` 的链接、无其他未实现链接与 metadata 标题；验证：测试通过。

## 5. 根布局与落地页接入

- [x] 5.1 修改 `apps/shell/src/app/layout.tsx`，把标题改为默认值 `墨栈 Inkstack` 与模板 `%s · 墨栈 Inkstack`；验证：`pnpm --filter @inkstack/shell typecheck` 通过。
- [x] 5.2 修改 `apps/shell/src/app/not-found.tsx` 的标题为“页面不存在”，并断言不再重复产品名；验证：相关测试通过。
- [x] 5.3 更新 `apps/shell/src/app/page.tsx` 的阶段文案，并添加指向 `/login` 与 `/register` 的入口；同步修改 `apps/shell/test/app/page.test.tsx`，断言两个链接存在且没有其他未实现链接。验证：`pnpm --filter @inkstack/shell test` 通过。
- [x] 5.4 在 `apps/shell/next.config.ts` 开启 `typedRoutes: true`；验证：`pnpm --filter @inkstack/shell typecheck` 通过，两个认证链接没有类型错误。
- [x] 5.5 更新 `apps/shell/README.md` 的阶段说明，写明登录/注册为静态页面、认证尚未接入；验证：文档描述与实际路由一致。

## 6. 集成验证

- [x] 6.1 构建 shell 并确认 `/login`、`/register` 为静态路由；验证：`pnpm --filter @inkstack/shell build` 成功，构建输出列出两个路由。
- [x] 6.2 运行完整门禁；验证：`pnpm verify` 的 lint、manifest、docs、typecheck、coverage、build、format、hygiene 全部通过。
- [x] 6.3 手工验收 320 / 768 / 1280 三档视口、亮色 / 暗色 / 跟随系统切换与持久化、鼠标移动点亮网格、点击脉冲、减少动态下不自动动画、Tab 焦点顺序，以及 Enter 不触发导航；验证：记录各档观察结果，无横向滚动与死链。

## Workflow follow-up

- 评审通过后归档本变更，确认 `shell-auth-pages` 新规格与 `shell-pages` 修改已同步。
