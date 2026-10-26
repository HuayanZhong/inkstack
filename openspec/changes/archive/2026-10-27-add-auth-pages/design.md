# Design

## Context

- shell 是 Next.js 16 App Router 应用，已启用 `cacheComponents` 与 `partialPrefetching`；当前只有 `/` 落地页与根级状态页。
- 共享 UI 包使用 shadcn `base-nova` 与 Base UI，主题令牌在 `packages/ui/styles/globals.css`，暗色默认跟随系统，shell 另外提供显式切换；组件通过 `dist` 被应用消费，shadcn CLI 写入 UI 包源码。
- `shell-pages` 规范目前要求 `/` 不得链接未实现路由，本变更通过 delta spec 放开已实现的认证页。
- 认证尚未接入：BFF 只有健康检查，没有 session；设计记录已确定 Auth/session 归 BFF。
- 测试使用 Vitest + React Testing Library，测试按 `src/` 平级映射到包级 `test/`；UI 包覆盖率覆盖 `src/components/**/*.tsx`。
- Next 16 中 `typedRoutes` 需显式开启，认证拦截的文件名是 `proxy.ts`，`searchParams` 属于请求时 API。

## Goals / Non-Goals

**Goals:**

- 用 `(auth)` 路由组承载登录与注册，固定认证页的共享外壳与扁平 URL。
- 页面内容静态：认证页与表单保持 Server Component、无自有事件逻辑；CursorGrid 背景与 Base UI 表单控件是仅有的客户端边界；不发起认证请求。
- 复用现有主题令牌与共享 UI 组件，不新增视觉系统。
- 让后续接入 BFF 认证时只替换表单行为，不重做页面与路由。

**Non-Goals:**

- 不实现真实登录、注册、session、BFF/Supabase 调用。
- 不实现 `/canvas`、工作区布局、路由守卫或 `proxy.ts`。
- 不做 OAuth、找回密码、重置密码、邮箱确认。
- 不建立 spec 级视觉契约，不修改现有页面视觉。

## Decisions

### 1. 路由：`(auth)` 组 + 扁平 URL，`(workspace)` 仅预留

```text
src/app/
├── layout.tsx                  根布局
├── page.tsx                    /
├── (auth)/
│   ├── layout.tsx              认证页共享外壳
│   ├── login/page.tsx          /login
│   └── register/page.tsx       /register
├── (workspace)/                /canvas —— 只在设计中预留
├── loading.tsx
├── error.tsx
├── global-error.tsx
└── not-found.tsx
```

- `(auth)` 让登录与注册共享品牌头、书脊线、分隔线与版心；URL 不受组名影响。
- 不采用 `/auth/login` 这类嵌套路径：认证不是 URL 语义的一部分，且未来找回密码也应保持短路径。
- 保持单一根布局。多 root layout 会在组间导航时整页刷新，并复制 html/body/主题接线。
- `(workspace)` 本次不创建文件；等工作区结构确定后再加 layout 与 `/canvas`。
- shell 不新增 Route Handler。Supabase code 交换、session cookie 等属于 BFF；在 shell 写回调会形成第二个后端入口。

### 2. 页面：纯 Server Component，提交明确不可用

- 登录页与注册页都是 Server Component，不使用 `'use client'`。
- 共享 `Input` 基于 Base UI，会带入少量客户端代码；`Label` 是生成的纯标签组件。认证布局额外使用 CursorGrid 客户端背景，但页面本身不包含事件处理或状态，静态渲染与禁用提交的结论不变。
- 表单保留真实 `<form>` 语义，但不设置 `action`；提交按钮 `type="submit" disabled`。
- 禁用提交按钮使浏览器隐式提交不生效，按 Enter 不会导航；不需要客户端 `preventDefault`。
- 不引入“看起来可点”的客户端空操作：那会增加 JS 并制造假行为。
- 本次不读 `?next=`。在 `cacheComponents` 下读取 `searchParams` 会引入请求时渲染或 Suspense 边界，留到认证接入时处理。

### 3. 视觉：书页分栏

```text
+---------------------------+----------------------------+
| INKSTACK                  |  回到墨栈                  |
|                           |  使用邮箱和密码进入你的画布。|
|    墨                     |                            |
|    栈                     |  邮箱                      |
|                           |  +----------------------+  |
|                           |  +----------------------+  |
|    让 AI 落笔...          |  |                      |  |
|                           |  +----------------------+  |
|                           |  密码                      |
|                           |  +----------------------+  |
|                           |  |                      |  |
|                           |  +----------------------+  |
|                           |  [ 登录 ]  尚未接入        |
+---------------------------+----------------------------+
```

- 桌面端左右分栏：左侧书脊 `bg-card` + 右侧发丝线，右侧版心放表单；移动端上下堆叠，书脊变为顶部品牌头。
- 背景是整页 CursorGrid 网格；书脊与表单面板半透明并带 `backdrop-blur`，让网格在版心周围透出，但不影响文字可读性。
- 品牌字使用现有宋体展示栈；桌面竖排，移动端横排；输入框保持 `base-nova` 的默认边框、圆角与高度。
- 页面本身是纸：不加大面积阴影或大圆角；表单面板只用细边框与半透明底色区分版心；不覆盖共享组件样式。
- 左栏用 `card → transparent` 的横向渐变代替实心块，让 CursorGrid 在书脊边缘透出；竖排标题用顶部到次级色的渐变，并在左侧加一条短书脊线。
- 右栏表单是独立卡片：`rounded-[1.5rem]`、细描边、`ring`、`shadow-2xl`、半透明底色与顶部高光，确保网格不吞掉表单；卡片内加 `AUTH / LOGIN` 或 `AUTH / SIGNUP` 等宽眉题。
- 页面不放独立印章标记；印章红只保留在输入聚焦环等少量状态提示上。
- 只用现有令牌，不新增色值；暗色默认跟随系统，认证页右上角可切换亮色 / 暗色 / 跟随系统；无入场动画。
- 320px 起保持可操作，页面允许纵向滚动。

### 4. 背景：vendored CursorGrid

- 背景使用 React Bits 的 [CursorGrid](https://reactbits.dev/animations/cursor-grid)；源码与 CSS 放在 `apps/shell/src/components/react-bits/cursor-grid/`，应用适配层放在 `apps/shell/src/components/auth/auth-cursor-grid.tsx`。
- 整页网格使用 `dashed` 线型；静息线色取 `--muted-foreground`，指针点亮与点击脉冲取 `--seal`，透明度压到很低，避免抢表单；`lightMode` 由 `<html>` 的 `.dark` / `.light` 类决定。
- CursorGrid 是 WebGL2 客户端组件；无 WebGL2 时直接返回内容，不影响表单。开发模式 StrictMode 会卸载重挂，清理时不再主动 `loseContext()`；上下文丢失时隐藏 canvas，由容器底色兜底。
- 减少动态偏好下关闭 intro / ambient / click pulse 自动动画；表单交互不受影响。`cursor-grid.tsx` 依赖真实 GPU，从 shell 覆盖率中排除，理由写在 vitest 配置。

### 5. 共享组件：CLI 生成，不手写副本

- 执行 `pnpm dlx shadcn@latest add input label -c apps/shell`，生成物落入 `packages/ui/src/components`；不引入 `field` 组合。
- 生成后先读实际组件 API，再写页面；在 `packages/ui/src/index.ts` 补导出，执行 `pnpm --filter @inkstack/ui build` 供 shell 消费。
- 生成组件保持 CLI 原样：页面不为 `Input` 覆盖边框、圆角、高度或焦点环，`className` 只用于布局。
- UI 包覆盖率包含所有 `src/components/**/*.tsx`，新增组件必须补行为测试；不能仅靠 `exclude` 抬高数字。
- 登录页组合留在 shell，不进入 UI 包；UI 包不承载业务页面。

### 6. 元信息与路由类型

- 根布局标题改为 `{ default: '墨栈 Inkstack', template: '%s · 墨栈 Inkstack' }`。
- 登录页与注册页分别声明 `title: '登录'`、`title: '注册'`。
- 同步把 `not-found.tsx` 的标题从“页面不存在 · 墨栈 Inkstack”改为“页面不存在”，避免模板叠加出重复后缀。
- 开启 `typedRoutes: true`；`typecheck` 已有 `next typegen`，链接拼错会在类型检查阶段失败。

### 7. 链接与测试约束

- 认证页只链接已实现路由：登录页链接 `/register`，注册页链接 `/login`；不出现找回密码、重置密码链接。
- `/` 链接 `/login` 与 `/register`，两者都已实现，符合修改后的 `shell-pages` 要求。
- 测试文件按源码平级映射：
  - `apps/shell/test/app/(auth)/layout.test.tsx`
  - `apps/shell/test/app/(auth)/login/page.test.tsx`
  - `apps/shell/test/app/(auth)/register/page.test.tsx`
  - `apps/shell/test/app/page.test.tsx` 更新链接断言
  - `packages/ui/test/components/{input,label}.test.tsx`

### 8. 认证字段对齐 Supabase Auth

- Supabase Auth 的邮箱密码流程使用 `signUp({ email, password })` 与 `signInWithPassword({ email, password })`，没有确认密码参数；注册页因此只保留邮箱与密码。
- 托管 Supabase 项目默认开启邮箱确认，本地/自托管默认关闭。开启确认时 `signUp` 不会立即返回 session，接入认证后需要“查收邮件”状态；本静态变更不实现。
- 密码策略由 Supabase 项目配置决定，静态页不写死长度或复杂度规则。

### 9. 主题切换

- shell 根布局使用 `next-themes` 的 `ThemeProvider`（`attribute="class"`、`defaultTheme="system"`、`enableSystem`、`disableTransitionOnChange`），`<html>` 加 `suppressHydrationWarning`。
- 认证页右上角放共享 `ModeToggle`，提供亮色 / 暗色 / 跟随系统；选择由 `next-themes` 持久化。
- `globals.css` 增加 `.dark` / `.light` 令牌与 `@custom-variant dark`；系统媒体查询只匹配没有显式 class 的根节点，供未接入 ThemeProvider 的 canvas 使用。两处暗色令牌需同步。
- `AuthCursorGrid` 用 `MutationObserver` 观察 `<html>` 的 class，从 `--muted-foreground` / `--seal` 重新读取网格颜色；切换主题时网格同步。

## Risks / Trade-offs

- **新增 UI 组件拉低覆盖率** → 为 `Input`、`Label` 补行为测试；确需排除时在配置中写明理由，不能宽泛排除。
- **共享组件带入客户端代码** → Base UI 的 `Input` 以客户端组件分发；`Label` 是纯标签组件。接受这部分基础代码，页面本身仍不包含事件处理与状态。
- **页面级 className 覆盖共享组件** → 会绕过 `base-nova` 的视觉规则；本变更明确禁止，`className` 只用于布局。
- **WebGL2 不可用或上下文丢失** → CursorGrid 无 WebGL2 时直接返回内容；上下文丢失时隐藏 canvas，容器底色兜底，页面不会白屏。
- **StrictMode 双挂载** → 移除上游清理时的 `WEBGL_lose_context` 主动丢上下文；避免第二次挂载拿到已丢失的 WebGL2 上下文。
- **CursorGrid 覆盖率** → WebGL2 网格依赖真实 GPU，jsdom 无实现；在 shell vitest 配置中排除并写明理由，包装层与页面仍由测试覆盖。
- **双暗色来源** → `.dark` 与系统媒体查询需同步；媒体查询限定 `:not(.light):not(.dark)`，避免与手动选择冲突。
- **next-themes hydration** → 根布局 `<html>` 使用 `suppressHydrationWarning`，并在 `<body>` 内包 `ThemeProvider`。
- **canvas 未接入 ThemeProvider** → 媒体回退保留；shell 用 `.light` / `.dark`，canvas 继续跟随系统。
- **ModeToggle 测试** → 认证布局测试 mock `next-themes`；网格适配层测试覆盖 palette 读取与主题类。
- **禁用按钮看起来像坏页面** → 阶段说明明确写出“尚未接入”；这是静态阶段的诚实状态，不用假交互掩盖。
- **标题模板造成双后缀** → 本变更同步修正 404 标题，并在测试中断言。
- **未来 BFF 与 shell 不同源** → BFF 设置的 session cookie 默认不被 shell 读取；接入认证时需决定同源反向代理或 cookie domain，不影响本次页面。
- **注册假设** → 本变更按自助注册处理；若改为邀请制，删除 `/register` 与两侧互链，URL 与其余结构不变。
- **路由组迁移** → 若最终不做注册，`login/` 可从 `(auth)` 移回扁平目录；URL 不变。

## Migration Plan

1. 先补共享 `Input`、`Label` 与导出，运行 UI 包测试与构建。
2. 再加 `(auth)/layout.tsx` 与两个页面，最后更新根布局、落地页、404 与 `next.config.ts`。
3. 运行 shell 测试、typecheck、build，最后执行 `pnpm verify`。
4. 无数据迁移与持久化状态；回滚即撤销本变更的文件与配置。

## Open Questions

- 登录后的工作区主路由最终用 `/canvas` 还是 `/workspace`；本次只预留一个位置，不影响认证页。
- 路由守卫放在 shell 的 `proxy.ts` 还是由 BFF 统一拦截；取决于后续 session cookie 的同源策略，不影响本次静态页面。
