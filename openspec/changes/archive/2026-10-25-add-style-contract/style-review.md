# 风格评审

## 五条定调

- **纸面，不是卡片墙**：符合。本次不新增页面，也不改变 `CanvasShell` / `Artboard` 的构图。
- **工具可见**：符合。标尺、点阵、状态栏、工具/图层栏保持原样。
- **一处朱砂**：符合。`BrushStroke` 的 `tone` 从颜色名改为语义名（`default` / `error`），颜色映射不变；印章红用法不变。
- **三种字各司其职**：符合。未新增字体角色；路由/阶段等 chrome 标签的 mono 用法已写进契约。
- **落笔即静**：符合。动效白名单、时长/延迟与 reduced-motion 规则未放宽。

## 参考页对照

本次不新增页面；`/`、`not-found`、`error`、`loading`、`global-error` 五页保持现状，并作为后续页面的对照基线。

## 风格影响

无视觉变化。`BrushStroke` 只调整 props 语义，渲染结果与现有页面一致；`not-found` 的空画板措辞改为 `tone="default"` + `meta="empty"`，与实际代码一致。

## 例外

无。检查器当前没有 allowlist 条目；令牌文件与 `public` 资产本来就不在扫描范围。
