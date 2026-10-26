---
paths:
  - 'apps/shell/**'
  - 'apps/canvas/**'
  - 'packages/ui/**'
---

# 设计

适用于 shell / canvas 的页面视觉、认证页与共享 UI 呈现层。行为约束在 [`openspec/specs/`](../../openspec/specs/)；组件生成与构建见 [`packages/ui/AGENTS.md`](../../packages/ui/AGENTS.md)。这里只写设计取向与易错点。

## 视觉取向

- 材料是纸、墨、印章红。只用共享主题令牌，页面不写死色值；印章红只做焦点环、选区或交互高亮，不做大面积背景，也不放独立红色印章块。
- 拒绝“干秃秃”的通用居中表单。优先书页式分栏：左书脊放品牌，右版心放表单；移动端自然堆叠。
- 左书脊不要做成实心块：用 `card → transparent` 渐变让背景网格透出；品牌字可用顶部到次级色的渐变，并配一条短书脊线。
- 表单必须是明确的视觉焦点：圆角卡片、细描边、`ring`、阴影、顶部高光、等宽眉题（如 `AUTH / LOGIN`）；底色要足够不透明，不能被背景网格吞掉。
- 一个页面只保留一个记忆点，其余保持安静；细节服务结构，不做无意义装饰。

## 组件纯度

- shadcn `base-nova` 生成组件保持原样；页面 `className` 只做布局，不覆盖边框、圆角、高度、颜色或焦点环。需要新外观时做成共享 variant，或在页面层做背景 / 版式。
- 不必要不要引入 `field` / `separator`；CLI 依赖带出来的文件也要复核。
- 修改 vendored 组件必须在其目录 README 记录原因与更新方式。

## 背景与主题

- 认证页背景使用 vendored React Bits `CursorGrid`：`dashed` 线型，静息线色 `--muted-foreground`，点亮 / 脉冲用 `--seal`，透明度压低到不抢表单。
- 默认跟随系统；认证页右上角提供亮色 / 暗色 / 跟随系统切换。主题类与系统媒体回退并存，未接入 ThemeProvider 的 canvas 仍跟随系统。
- `prefers-reduced-motion: reduce` 关闭入场与环境动画；画布 `aria-hidden`、`pointer-events-none`。
- WebGL 清理不要主动 `loseContext()`：React StrictMode 双挂载会让第二次挂载拿到丢失上下文并白屏。上下文丢失时隐藏 canvas，用容器底色兜底。

## 目录与认证

- 认证适配层放 `apps/shell/src/components/auth/`；React Bits 等上游组件放 `apps/shell/src/components/react-bits/<component>/`，附 CSS 与 README。
- 文件名 kebab-case；测试按 `src/` 平级映射到 `test/`；依赖真实 GPU 的第三方组件在 vitest 配置写明覆盖率排除理由。
- 认证页在 `(auth)` 组，URL 为 `/login`、`/register`；shell 不写 Route Handler，Auth 归 BFF。注册只保留邮箱 + 密码，不设确认密码；具体行为以 [`shell-auth-pages`](../../openspec/specs/shell-auth-pages/spec.md) 为准。

## 验证

- 视觉改动至少看暗色 / 亮色与 320 / 768 / 1280；检查横向滚动、Tab 顺序、Enter 不导航、表单卡片与网格的对比。
- 优先用真实浏览器或 Chrome DevTools 观察；headless 截图可能因 WebGL、缓存或 StrictMode 失真。`Cache disabled` 先查 DevTools 的 Disable cache / 硬刷新，不要先改代码。
- 完成前跑 `pnpm verify`。设计取向不写成 spec 级硬契约，spec 只约束行为。
