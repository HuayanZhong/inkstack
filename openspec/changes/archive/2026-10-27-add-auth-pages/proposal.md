# Proposal

## Why

shell 目前只有 `/` 落地页，认证入口没有任何页面可落。画布与工作区都依赖登录后的身份，因此在接入真实认证之前，先把登录、注册的静态页面与路由骨架搭好，可以固定视觉方向、验证共享组件，并让后续 BFF 认证接入只替换表单行为，不重做页面结构。

本次只做静态页面：不调用 BFF、不接 Supabase、不实现工作区，提交操作保持不可用。

## What Changes

- 新增 `(auth)` 路由组：`/login` 与 `/register` 使用同一套书页分栏认证外壳（品牌头、书脊线、半透明版心），URL 保持扁平。
- 新增静态登录页：邮箱、密码、禁用的登录操作与“登录尚未接入”阶段说明。
- 新增静态注册页：邮箱、密码、禁用的注册操作与“注册尚未接入”阶段说明。
- 认证字段与 Supabase Auth 的 `signUp` / `signInWithPassword` 对齐：只需要邮箱与密码，不设确认密码字段。
- 认证页背景使用 React Bits 的 `CursorGrid`（vendored WebGL2 组件）：整页网格随指针点亮，点击产生脉冲；系统亮暗切换线色，减少动态偏好下关闭自动入场动画。
- 认证页右上角提供主题切换（亮色 / 暗色 / 跟随系统）；根布局接入 `next-themes`，主题类与系统偏好回退并存。
- 登录页与注册页互链；不链接找回密码、重置密码等尚未实现的路由。
- 从 `@inkstack/ui` 引入共享的 `Input`、`Label`、`Button`；新增组件通过 shadcn CLI 生成，不手写副本，也不在页面覆盖组件样式。
- `/` 落地页更新阶段文案，并链接到已实现的 `/login` 与 `/register`。
- 根布局启用标题模板 `%s · 墨栈 Inkstack`，并修正 404 页标题避免重复后缀。
- 开启 Next.js `typedRoutes`，让路由链接在类型检查阶段被校验。
- 路由设计预留登录后的 `/canvas` 位置；本次不创建文件、不设计工作区结构。
- shell 不新增任何 Route Handler；认证接口与 session 处理仍归 BFF。

## Capabilities

### New Capabilities

- `shell-auth-pages`: 定义 shell 登录页与注册页的静态行为契约，包括可达性、表单字段语义、静态阶段不发起认证、认证页互链与窄视口可用性。

### Modified Capabilities

- `shell-pages`: 根入口页允许链接已实现的认证页并更新阶段说明；根布局增加标题模板；共享 UI 组件要求覆盖认证页。

## Impact

- `apps/shell`：新增认证页与认证布局，修改根布局元信息、落地页、`next.config.ts` 与 README。
- `apps/shell/src/components/auth/`：认证页适配层；`apps/shell/src/components/react-bits/cursor-grid/`：vendored CursorGrid 与 CSS，文件名统一 kebab-case。无新增 npm 依赖。
- `packages/ui`：新增 `input`、`label` 组件及其导出与测试；不引入 `field` 组合，不新增业务组件。
- `packages/ui/styles/globals.css`：增加 `.dark` / `.light` 主题类与媒体回退；shell 根布局接入 `ThemeProvider`，认证页右上角使用共享 `ModeToggle`。
- 依赖：不新增运行时依赖；shadcn 生成物若引入新包，按 catalog 规则登记。
- 服务端：BFF、Gateway、canvas 均不改动；本变更不产生任何认证请求。
- 规格：新增 `shell-auth-pages`，修改 `shell-pages`；`/canvas` 与认证守卫不在本变更落地。
- 假设：注册按自助注册处理；若产品改为邀请制，删除 `/register` 与相关链接即可，其余结构不变。
