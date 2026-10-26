# CursorGrid

来源：[React Bits · CursorGrid](https://reactbits.dev/animations/cursor-grid)。

本目录是上游组件的 vendored 副本，应用侧通过 [auth/auth-cursor-grid.tsx](../../auth/auth-cursor-grid.tsx) 适配系统亮暗后使用。

## 本地改动

- 源文件由 JS 转为 TSX，补齐 props 与 WebGL 类型。
- 为 `ResizeObserver` / `IntersectionObserver` / `matchMedia` 增加环境守卫，保证无 WebGL 或测试环境仍能渲染内容。
- 移除清理时的 `WEBGL_lose_context` 主动丢上下文：React StrictMode 的卸载重挂会让第二次挂载拿到已丢失的 WebGL2 上下文。上下文丢失时改为隐藏画布，由容器底色兜底。
- 文件名改为 kebab-case；CSS 类名保持上游的 `.cursor-grid*`。

## 更新方式

从上游重新复制后，重新应用上述改动，并保持默认导出、props 与 CSS 类名兼容。视觉验收由浏览器截图覆盖；`apps/shell/vitest.config.ts` 将其排除出覆盖率统计。
