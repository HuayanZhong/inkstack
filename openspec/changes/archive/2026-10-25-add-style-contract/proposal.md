# Proposal

## Why

这套「画布工作台」的视觉方向目前只存在于代码和这次对话里：令牌、字体、画板、笔触、动效都没有一份可读的契约。后续页面或 AI 改动很容易各写一套，之前 404 因为 Tailwind 没扫到 `src/app` 而失去样式，就是一个已经发生的例子。`ui-system` 规格只约束了共享组件、主题令牌与暗色机制，没有约束字体角色、版式签名、动效和“什么算同一种风格”。

现有方案只有“契约验收”的骨架，缺少可执行边界。这次把当前视觉固化成一份 **AI 可读、逐条列出允许/禁止边界的样式契约**，明确哪些规则由 CI 机械检查、哪些只能评审，然后用 CI 验收。

## What Changes

- 新增 `.claude/rules/design-system.md`：面向 AI 的视觉样式契约，按 `apps/shell/**`、`apps/canvas/**`、`packages/ui/**` 自动加载；在根 `AGENTS.md` 留一行入口。
- 契约固定十节，先定调、再写边界：
  1. **风格定调**：一句话“每一页都是制图桌上的一张纸，不是一块仪表盘”；五条定调（纸面非卡片墙、工具可见、一处朱砂、三种字、落笔即静）、是/不是对照表与五张参考页；新页面先对照再动手。
  2. **颜色**：禁止 hex/rgb/hsl/oklch 字面量、Tailwind 调色板类（`bg-red-500`）、任意色值类、内联 `style` 颜色、令牌文件外的同名 CSS 变量；允许语义类、语义色透明度、`currentColor`、`transparent`、`var()`、令牌派生 `color-mix`。印章红只用于选区/手柄/题注印点/笔触/眉标，不铺大面积背景或正文；错误只用 `--destructive`。
  3. **数值与间距**：禁止 allowlist 外的 magic number；允许 Tailwind 标准尺度与布局常量（56/36/8/24px、48rem、220px、`p-6/sm:p-10`、`max-w-6xl`、`gap-6`、`max-w-2xl/xl`）；现有 9/10/11px、`0.62em`、行高 1.1/1.12、字距 0.04–0.42em、`vertical-rl` 作为白名单，新值先加令牌。工作台直角，仅圆点 `rounded-full`；阴影只用 `shadow-lg` 画板与 `shadow-md` 浮层；禁止渐变、玻璃与发光；z-index 只用 `z-50`；透明度只用语义色 `/nn` 与 disabled 50；动效时长 300/520/720/760ms、延迟 120/160/230/420ms、缓动 `cubic-bezier(0.22,1,0.36,1)`。
  4. **字体**：`font-heading` 只用于页面 h1、品牌“墨栈”、竖排题注；`font-sans` 正文；`font-mono` 只用于英文技术标签、坐标、状态、计数；不使用 `font-display`；禁止 `next/font`、主题外字体栈/`font-family`/`font-[…]`；中文正文不用 mono 大字距。
  5. **布局**：页面一律 `CanvasShell` → 单个 `Artboard`，不得自建 chrome；`global-error` 例外自带 `<html>/<body>` 与 `globals.css`；固定 56px 顶栏、36px 底栏、8px 标尺、24px 点阵、`max-w-6xl/gap-6`、`lg` 两栏 `48rem + 220px`；aside 在 `<lg` 下移；Artboard 虚线 `-inset-2`、四角 `size-2`、内容 `p-6 sm:p-10`；断点只用 `sm`/`lg`。
  6. **组件写法**：`packages/ui` 只放通用原语，shell 专用组合放 `_components`，页面只组合；`_components` 只用命名导出、禁止 `React.FC`，每个接收 props 的导出组件声明 `<Name>Props`；`className` 放最后并用 `cn()`；变体用语义 `tone`（`default`/`error`/`loading`）；默认 Server Component；四种状态用同一套画板表达；测试放 `apps/shell/test/app/`；附组件清单与页面骨架图。
  7. **签名与动效**：每页恰好一个画板；每个路由页最多一个 `BrushStroke`、一处竖排题注；笔触只压主句关键词；入场动画白名单为 `artboard-in`/`handle-in`/`ink-in`/`brush-reveal`，加载态额外允许 `animate-pulse` 与共享库动效；除加载态外不允许无限动画；全部尊重 `prefers-reduced-motion`。
  8. **暗色**：只跟随 `prefers-color-scheme`；允许 `dark:` 变体；应用禁止 `.dark` 类、`setTheme`、`ThemeProvider`、`ModeToggle`；`packages/ui` 可以保留导出，但应用不得引用；禁止第二处暗色令牌。
  9. **文案与可访问性**：中文为主、动作与结果同名（重试/返回首页）、错误说明发生了什么与如何恢复、空/加载写状态；技术标签用等宽英文大写，坐标固定 `x 0000 y 0000 · 100%`；路由页恰好一个 h1（`loading` 不写 h1）；装饰元素 `aria-hidden`，loading 用 `role=status`，焦点可见，信息性正文对比度 ≥ 4.5:1，`muted/70` 只用于装饰。
  10. **变更流程**：新增、重命名或改变语义的令牌/字体/布局常量/动效/组件骨架/组件清单时，同一变更更新契约与令牌；仅调整既有令牌值不改契约。规则使用稳定 ID 并标注 `[CI:<id>]` 或 `[REVIEW:<id>]`；`[CI:<id>]` 规则必须在 `check-style.mjs` 有同名检查；allowlist 只写精确路径/正则/原因/移除条件，禁止目录级忽略。UI 变更必须写明风格影响，新增页面必须对照五张参考页；先改契约再破例。
- 新增 `scripts/check-style.mjs` 与根脚本 `check:styles` / `check:styles:build`：
  - 源码检查：颜色字面量、调色板类、任意色值、内联颜色、令牌外同名变量、`next/font`、主题外 `font-family`、`font-display`、应用内主题切换、共享样式入口与 `@source`、动效白名单、契约十节。
  - 新增结构与一致性检查：路由页必须 `CanvasShell` + 恰好一个 `Artboard`、不得自建 `header/footer/aside`；`global-error` 自带 `<html>/<body>`；每个路由页最多一个笔触与一处题注；shell 只允许直角与两种阴影；禁止渐变/玻璃/发光；`_components` 命名导出且声明 `<Name>Props`；路由页恰好一个 h1（`loading` 除外）。
  - 产物检查：shell 与 canvas 的 CSS 必须包含共享令牌与关键类，防止再次出现“页面没样式”。
- 把检查接入 `pnpm verify`，并在 CI 的 static 与 build 作业中显式执行；失败即阻断合并。
- 不改变现有视觉：令牌值、页面布局、文案、动效都保持当前状态；允许把现有字号/字距固化成令牌，视觉不变。
- **不做**：删除未使用的 `ModeToggle` / `ThemeProvider`、新增页面、调整信息架构、引入新字体或新配色。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `ui-system`: 增加“AI 可读的详细样式契约”“源码样式 CI 验收”“构建产物样式 CI 验收”“契约规则与检查保持一致”“风格定调与组件写法有单一来源”五项行为要求；现有令牌、暗色与共享组件要求不变。

## Impact

- 新增：`.claude/rules/design-system.md`、`scripts/check-style.mjs`。
- 修改：根 `AGENTS.md`（入口）、根 `package.json`（`check:styles` / `check:styles:build`、`verify` 链）、`docs/ci-cd.md`（新增检查说明）、`.github/workflows/ci-static.yml`、`.github/workflows/ci-build.yml`、`apps/shell/src/app/_components/canvas-shell.tsx`（把 `BrushStroke` 的内联 props 提取为 `BrushStrokeProps`，并把 `tone` 从颜色名改为 `default`/`error`；渲染不变）。
- 归档后：`openspec/specs/ui-system/spec.md` 增加五项要求。
- 不修改 `apps/shell`、`apps/canvas` 的视觉与 `packages/ui/styles/globals.css` 的令牌值；如新增令牌，只固化现有字号/字距，不改变渲染。
- 开发体验：以后新增颜色、字体、版式、动效或组件必须同时更新契约与令牌/组件清单；CI 会拒绝硬编码颜色、调色板类、主题外字体、未列入白名单的动效、绕开共享样式入口、自建页面 chrome、非工作台圆角/阴影/渐变、默认导出与缺失 props 类型；风格定调、留白节奏、文案语气由 OpenSpec 评审负责。
