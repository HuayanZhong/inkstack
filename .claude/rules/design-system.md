---
paths:
  - 'apps/shell/**'
  - 'apps/canvas/**'
  - 'packages/ui/**'
---

# 视觉样式契约

> 令牌唯一来源：`packages/ui/styles/globals.css`。色值与字体栈只引用令牌名；布局常量与动效数值直接写在契约里，调整它们按 `CONTRACT-03` 处理。
> 适用范围：第 1–4、7–9 节适用于 shell、canvas、packages/ui；第 5、6 节与参考页主要约束 shell；canvas 的 tldraw 内部视觉与 `public` 资产不在本契约范围。
> 每条规则用 `[CI:<id>]` 或 `[REVIEW:<id>]` 标注；`[CI]` 由 `pnpm check:styles` 检查，`[REVIEW]` 由 OpenSpec 评审覆盖。未标 ID 的条目是解释或取值清单，执行以带 ID 的行为规则为准。

## 1. 风格定调

**一句话：每一页都是制图桌上的一张纸，不是一块仪表盘。**

五条定调优先于下面的具体数值；具体规则与定调冲突时，先改规则。

- [REVIEW:IDENTITY-01] **纸面，不是卡片墙。** 页面主体是 `CanvasShell` 里的一张 `Artboard`；分面靠 1px 界线与留白，不靠圆角卡片、彩色底块或阴影堆叠。
- [REVIEW:IDENTITY-02] **工具可见。** 标尺、点阵、状态栏、工具/图层栏是构图的一部分；它们只能单色，不能抢内容。
- [REVIEW:IDENTITY-03] **一处朱砂。** 印章红只做批注记号：选区、手柄、印点、笔触、眉标、标题关键词、工具/图层标记。一页的红点是标点，不是装饰；不铺面、不做图标、不做按钮底色。
- [REVIEW:IDENTITY-04] **三种字各司其职。** 宋体发声（h1、品牌、竖排题注），黑体阅读（正文），等宽计量（英文标签、坐标、状态、计数）。不混用、不新增第四种角色。
- [REVIEW:IDENTITY-05] **落笔即静。** 入场一笔带过就停住；不循环、不弹跳、不视差。静止状态才是常态。

**是什么 / 不是什么**

| 是                                 | 不是                             |
| ---------------------------------- | -------------------------------- |
| 制图工作台、纸面、选中框、编辑批注 | SaaS 仪表盘、统计卡片、KPI、图表 |
| 宋体大标题 + 等宽小标签            | 营销落地页、hero 插画、emoji     |
| 1px 界线、直角、留白               | 圆角卡片墙、玻璃拟态、渐变、发光 |
| 单色 chrome + 一点印章红           | 多彩图标、彩色标签、大面积品牌色 |
| 跟随系统的明暗                     | 页面里的主题切换器               |

**参考页**（新页面先对照，再动手）

| 页面           | 固定什么                                                          |
| -------------- | ----------------------------------------------------------------- |
| `/`            | 完整构图：眉标 → h1 → 笔触 → 正文 → 状态说明 → 工具栏             |
| `not-found`    | 空画布：`tone="default"` + `meta="empty"` + 擦除式笔触 + 返回动作 |
| `error`        | 错误画板：`tone="error"` + 重试/返回两个动作                      |
| `loading`      | 骨架：`tone="loading"` + 状态区，不写 h1                          |
| `global-error` | 根错误：自带 `<html>/<body>`，仍使用同一套画板语言                |

- [REVIEW:IDENTITY-06] 新页面截图放进上面五页里，如果像另一个产品，就是错的；先改到像同一套工作台，再提交评审。

## 2. 颜色

- [CI:COLOR-01] 禁止在样式源码中写 hex、`rgb()`、`hsl()`、`oklch()` 颜色字面量。
- [CI:COLOR-02] 禁止 Tailwind 调色板类，例如 `bg-red-500`、`text-white`、`border-gray-200`；只用语义类。
- [CI:COLOR-03] 禁止 `[#...]` 任意色值、内联 `style` 颜色、令牌文件外的同名 CSS 变量。
- [REVIEW:COLOR-04] 印章红 `--seal` 只用于选区、手柄、题注印点、笔触、眉标、标题关键词与工具/图层标记；不铺大面积背景，不用于正文。
- [REVIEW:COLOR-05] 错误状态只用 `--destructive`，不得与 `--seal` 互换；当前两者同值，但语义分离。
- 允许：语义类（`bg-background`、`text-foreground`、`text-muted-foreground`、`border-border`、`bg-card`、`text-seal`、`*-destructive`）、语义色透明度、`currentColor`、`transparent`、`var()`、令牌派生 `color-mix`。
- 角色映射：纸=`--background`、墨=`--foreground`、卡片=`--card`、石墨=`--muted-foreground`、界线=`--border`、印章红=`--seal`、错误=`--destructive`。

## 3. 数值与间距

- [CI:VALUE-01] 动效只使用白名单：时长（duration）300/520/720/760ms，延迟（delay）120/160/230/420ms，缓动 `cubic-bezier(0.22, 1, 0.36, 1)`。只接受 `ms`，不接受 `s`；Tailwind 的 `duration-*` / `delay-*` 与 `ease-*` 同规则。
- [REVIEW:VALUE-02] 间距与字号优先 Tailwind 标准尺度与布局常量；新的 magic number 先加令牌。
- [REVIEW:VALUE-03] 圆角、边框、阴影、z-index、断点、透明度按下面边界使用；直角与阴影的机械部分见 `VALUE-04`。
- [CI:VALUE-04] shell 应用的工作台表面只用直角：禁止 `rounded-sm|md|lg|xl|2xl|3xl`、方向圆角、裸 `rounded` 与 `rounded-[…]`；只允许 `rounded-full`（圆点）与 `rounded-none`。阴影只允许 `shadow-lg`（画板）与 `shadow-md`（浮层），禁止其他阴影。
- [CI:SURFACE-01] shell 应用的组件与页面表面禁止渐变、玻璃与发光效果：`bg-gradient-*`、`bg-linear-*`、任意值渐变、`bg-clip-text`、`backdrop-blur-*`、`drop-shadow-*`。`.canvas-grid` 与 `.canvas-ruler-*` 的底纹/标尺纹理渐变是唯一例外。
- 布局常量：顶栏 56px、底栏 36px、标尺 8px、点阵 24px、画板 48rem、侧栏 220px、栅格间距 24px。
- 现有 allowlist：9/10/11px 字号、`0.62em`、行高 1.1/1.12、字距 0.04–0.42em、`vertical-rl`、`var()/calc()/min()`。
- 圆角：工作台直角，仅圆点用 `rounded-full`；共享组件使用 `--radius-*`。
- 边框 1px、选区虚线、焦点 ring 3；阴影只用 `shadow-lg`（画板）与 `shadow-md`（浮层）；z-index 只用 `z-50`；透明度只用语义色 `/nn` 与 disabled 50。

## 4. 字体

- [CI:FONT-01] 禁止 `next/font`；禁止令牌文件之外的 `font-family`。
- [CI:FONT-02] 禁止 `font-display` 与 `font-[…]`。
- [REVIEW:FONT-03] `font-heading` 只用于页面 h1、品牌“墨栈”、竖排题注；`font-sans` 正文；`font-mono` 只用于英文技术标签、坐标、状态、计数与路由/阶段等 chrome 标签。
- 中文正文不用 mono 大字距；坐标四位补零。

## 5. 布局

- [CI:LAYOUT-01] shell/canvas 必须导入 `@inkstack/ui/globals.css` 并声明 `@source`；shell 还需扫描 `../**/*.{ts,tsx}`。
- [REVIEW:LAYOUT-02] `global-error` 例外自带 `<html>/<body>` 与 `globals.css`；其余页面骨架由 `LAYOUT-03` 检查。
- [CI:LAYOUT-03] `apps/shell/src/app/**` 的路由页文件（`page|not-found|error|global-error|loading|forbidden|unauthorized`.tsx）必须使用 `CanvasShell` 且恰好一个 `Artboard`，不得直接写 `<header>`/`<footer>`/`<aside>`；`global-error.tsx` 还必须自带 `<html>`/`<body>`。
- [CI:STATE-01] 状态页必须使用对应画板：`error`/`global-error` 用 `tone="error"`，`loading` 用 `tone="loading"` + `role="status"`，`not-found` 提供 `href="/"` 的返回入口。
- 固定：`h-14` 顶栏、`h-9` 底栏、8px 标尺（`<sm` 隐藏）、24px 点阵、`max-w-6xl/gap-6`、`lg` 两栏 `48rem + 220px`；aside 在 `<lg` 下移；Artboard 虚线 `-inset-2`、四角 `size-2`、标题带 `px-4 py-2`、内容 `p-6 sm:p-10`；题注 `<sm` 隐藏；断点只用 `sm`/`lg`。

## 6. 组件写法

**分层**

- [REVIEW:COMP-03] `packages/ui` 只放通用原语（shadcn 组件、令牌、`cn`）；shell 专用组合放 `apps/shell/src/app/_components/`；页面文件只组合组件与文案，不新建 chrome、不内联一次性视觉原语。状态页的空/错/加载行是唯一例外，仍复用 `SidePanel` 的标题、间距与语义类。
- [REVIEW:COMP-04] 组件只通过 props 拿数据与文案，不读路由、不读全局状态；变体用语义 `tone`（`default`/`error`/`loading`），不用颜色名，不用一堆布尔开关。

**文件与导出**

- [CI:COMP-01] `_components/**` 只允许命名导出，禁止 `export default` 与 `React.FC`；路由页文件必须有 `export default`。
- [CI:COMP-02] `_components/**` 里每个接收 props 的 PascalCase 导出组件（函数或箭头函数）必须声明同名 `<Name>Props` 类型，并让参数引用它；`type` 与 `interface` 都接受，纯工具函数不在此列。
- [REVIEW:COMP-05] `className` 放最后一个 prop，用 `cn()` 合并；不通过 `className` 覆盖颜色、字体、圆角。

**页面骨架**

```text
CanvasShell
├─ header        品牌 / 路由 / 阶段
├─ main
│  ├─ Artboard   唯一纸面（tone: default | error | loading）
│  │  ├─ 眉标     font-mono 10px uppercase
│  │  ├─ h1       font-heading，每页 1 个
│  │  ├─ 正文     font-sans text-muted-foreground
│  │  └─ 动作     Button / buttonVariants
│  └─ aside      SidePanel + LayerRow（可选）
└─ footer        状态栏
```

**组件清单**

| 组件                        | 位置                                              | 职责               | 不要                     |
| --------------------------- | ------------------------------------------------- | ------------------ | ------------------------ |
| `CanvasShell`               | `apps/shell/src/app/_components/canvas-shell.tsx` | 唯一页面 chrome    | 放业务内容、读路由       |
| `Artboard`                  | 同上                                              | 唯一纸面与选中态   | 自建边框、手柄、阴影     |
| `BrushStroke`               | 同上                                              | 一页一处的强调笔触 | 改 path、重复使用        |
| `SidePanel`                 | 同上                                              | 工具/图层栏        | 当主导航、放按钮组       |
| `LayerRow`                  | 同上                                              | 单行工具/对象      | 做成可点击列表项（当前） |
| `Button` / `buttonVariants` | `packages/ui`                                     | 操作与链接         | 覆盖颜色、圆角、阴影     |

- [REVIEW:COMP-06] 新组件先判断归属：通用原语进 `packages/ui`，页面组合进 `_components`；同一个视觉结构出现第三次再抽象，不提前造组件。
- [REVIEW:COMP-07] `'use client'` 只用于错误边界和真正需要交互的叶子组件；默认 Server Component。
- [REVIEW:COMP-08] 状态覆盖：正常、空、加载、错误四种状态用同一套画板与文案规则表达；不另造一套错误页样式。
- [REVIEW:COMP-09] 测试位置与门槛见 [`.claude/rules/testing.md`](testing.md)；样式测试断言语义（标题、role、文案与主结构），不断言具体类名。

## 7. 签名与动效

- [CI:MOTION-01] 只允许 `artboard-in`、`handle-in`、`ink-in`、`brush-reveal`；`animate-pulse` 只允许出现在 `loading.tsx` 且必须与 `motion-reduce:animate-none` 同行；共享库动效允许；其他 `@keyframes`/`animation` 失败。
- [CI:SIGNATURE-01] 每个路由页文件最多一个 `BrushStroke`、一处 `annotation`。
- [CI:SIGNATURE-02] `BrushStroke` 的 path 固定为组件内的现有路径；页面不得新增 SVG 笔触。
- [REVIEW:MOTION-02] `BrushStroke` 只压主句关键词；竖排题注可选、单行、带印章红方点；除加载态外不允许无限动画；全部尊重 `prefers-reduced-motion`。

## 8. 暗色

- [CI:DARK-01] 应用禁止 `.dark` 类、`setTheme`、`ThemeProvider`、`ModeToggle`。
- [REVIEW:DARK-02] 只跟随 `prefers-color-scheme`；允许 `dark:` 变体；`packages/ui` 可保留导出但应用不得引用；禁止第二处暗色令牌。

## 9. 文案与可访问性

- [REVIEW:COPY-01] 中文为主；动作与结果同名（重试/返回首页）；错误说明发生了什么与如何恢复；空/加载写状态。
- [REVIEW:COPY-02] 技术标签等宽英文大写；坐标固定 `x 0000 y 0000 · 100%`。
- [REVIEW:COPY-03] 装饰元素 `aria-hidden`；loading 用 `role=status`；焦点可见；信息性正文对比度 ≥ 4.5:1；`muted/70` 只用于装饰。
- [CI:COPY-04] 路由页文件（`loading` 除外）恰好一个 `<h1>`；`loading` 不写 h1。

## 10. 变更流程

- [CI:CONTRACT-01] 以上十节标题必须存在。
- [CI:CONTRACT-02] 每个 `[CI:<id>]` 必须有同名检查；规则 ID 不得重复。
- [REVIEW:CONTRACT-03] 新增、重命名或改变语义的令牌/字体/布局常量/动效/组件骨架/组件清单才改契约；仅调整既有令牌值不改契约。
- [CI:CONTRACT-04] allowlist 条目必须含 `file`、`pattern`、`reason`、`removeWhen`；禁止目录级忽略、禁止 `.*` 全文件豁免（令牌文件除外）；pattern 必须命中文件内容。
- [CI:BUILT-01] shell 的 production CSS 必须包含 `--seal`、`--background`、`.min-h-dvh` 与 `.font-heading`。
- [CI:BUILT-02] canvas 的 production CSS 必须包含 `--seal`、`--background` 与 `.bg-primary`。
- [REVIEW:CONTRACT-05] UI 变更必须在 OpenSpec 变更中写明“风格影响”（无 / 页面 / 元素 / 截图）；新增页面必须对照五张参考页。
- [REVIEW:CONTRACT-06] 新增或放宽样式规则时，先改契约与检查，再改页面；不允许页面先破例、契约后补。
- [REVIEW:CONTRACT-07] 涉及 UI 的变更必须在变更目录写 `style-review.md`，逐条回答五条定调与参考页对照；归档前由评审者确认。

**`style-review.md` 最小内容**

- 五条定调逐条：符合 / 不符合 + 说明。
- 参考页对照：新页面最像哪一页、哪里不同。
- 风格影响：无 / 页面 / 元素 / 截图。
- 例外：规则 ID + 原因 + 移除条件。
