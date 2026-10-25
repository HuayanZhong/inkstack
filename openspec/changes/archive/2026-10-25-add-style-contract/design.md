# Design

## Context

- 当前视觉已经落在代码里：`packages/ui/styles/globals.css` 是唯一令牌来源，`apps/shell/src/app/_components/canvas-shell.tsx` 承载工作台与画板，页面只使用语义类。
- 样式源码（`.ts/.tsx/.css`）中的原始颜色只在令牌文件；`apps/shell/public/*.svg` 属于静态资产，不纳入样式源码扫描。`next/font` 只出现在 `AGENTS.md` 的禁令文字里；`font-family` 只在令牌文件。
- `ModeToggle` / `ThemeProvider` 存在于 `packages/ui`，但两个应用都没有引用；`ui-system` 规格要求暗色只跟随系统。
- `.claude/rules/*.md` 支持 `paths` 前置元数据，`pnpm check:docs` 会校验规则有非空 `paths` 且能从某个 `AGENTS.md` 到达；这是目前唯一“按路径自动加载给 AI”的机制。
- CI 分成 static / test / build 三个可复用工作流；`pnpm verify` 是本地等价门禁。`pnpm build` 产出 shell 的 `.next/static/**/*.css` 与 canvas 的 `dist/**/*.css`。

## Goals / Non-Goals

**Goals:**

- 用一份简短、可被 AI 自动加载的规则记录当前视觉方向，并逐条写明允许/禁止边界。
- 先写“我们是什么风格”，再写边界：一句话定调、五条原则、是/不是对照表与参考页，避免只有禁令没有方向。
- 把可机械判断的边界交给 CI，把风格一致性、留白、文案语气留给 OpenSpec 评审。
- 把组件分层、命名、props、变体与页面骨架写成统一写法，避免同名组件两种实现。
- 让每条规则都能看出执行方式，避免“写了但没人检查”。
- 保持现有视觉、令牌值、页面与文案不变；只把 `BrushStroke` 的内联 props 提取为类型，渲染不变。

**Non-Goals:**

- 不删除 `ModeToggle` / `ThemeProvider`，也不改 `next-themes` 依赖；本次只禁止应用使用。
- 不调整信息架构、页面清单或交互。
- 不把 tldraw 自身的 canvas 样式纳入契约；契约只覆盖 shell、canvas 的应用级样式与共享 UI。
- 不新增运行时依赖，检查器只用 Node 内置模块。
- 不在本次把所有间距/字号 magic number 都令牌化；先用 allowlist + `[REVIEW]` 控制新增值。

## Decisions

### 1. 契约放在 `.claude/rules/design-system.md`

该文件使用 `paths: apps/shell/**, apps/canvas/**, packages/ui/**`，编辑相关目录时由 harness 自动加载；根 `AGENTS.md` 增加一行入口，`pnpm check:docs` 负责验证可到达性。

备选是 `packages/ui/AGENTS.md`：只覆盖共享包，且该文件接近 25 行预算。备选是 `docs/design/style.md`：适合人读，但不会被 AI 按路径加载，无法承担“约束”职责。`docs/` 不再放第二份完整规则，避免漂移。

### 2. 契约固定十节，先定调再列允许/禁止与执行方式

契约章节顺序：风格定调 → 颜色 → 数值与间距 → 字体 → 布局 → 组件写法 → 签名与动效 → 暗色 → 文案与可访问性 → 变更流程。下表按主题归纳边界，完整条文以 `.claude/rules/design-system.md` 为准。

| 章节           | 必须写明的边界                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 执行                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 颜色           | 禁 hex/rgb()/hsl()/oklch() 字面量、`bg-red-500`/`text-white`/`border-gray-*` 等调色板类、`[#...]` 任意色值、内联 `style` 颜色、令牌文件外的同名 CSS 变量；允许语义类（`bg-background`、`text-foreground`、`text-muted-foreground`、`border-border`、`bg-card`、`text-seal`、`*-destructive`）、语义色透明度、`currentColor`、`transparent`、`var()`、令牌派生 `color-mix`。纸=`--background`、墨=`--foreground`、卡片=`--card`、石墨=`--muted-foreground`、界线=`--border`、印章红=`--seal`。印章红只用于选区/手柄/题注印点/笔触/眉标，不铺大面积背景或正文；错误只用 `--destructive`。当前两者同值，但语义分离，不得互换。 | 字面量/调色板类/任意值/内联颜色/重复变量 `[CI]`；印章红克制 `[REVIEW]`                          |
| 数值与间距     | 禁 allowlist 外 magic number；允许 Tailwind 标准尺度与布局常量：56/36/8/24px、48rem、220px、`p-6 sm:p-10`、`max-w-6xl`、`gap-6`、`max-w-2xl/xl`。现有 9/10/11px、`0.62em`、行高 1.1/1.12、字距 0.04–0.42em、`vertical-rl`、`var()/calc()/min()` 作为白名单；新值先加令牌。工作台直角，仅圆点 `rounded-full`；共享组件用 `--radius-*`。边框 1px/选区虚线/焦点 ring 3；阴影只用 `shadow-lg` 画板与 `shadow-md` 浮层；z-index 只用 `z-50`；透明度只用语义色 `/nn` 与 disabled 50；动效时长 300/520/720/760ms、延迟 120/160/230/420ms、缓动 `cubic-bezier(0.22,1,0.36,1)`。                                                     | 动效数值/`font-[…]`/任意色值 `[CI]`；间距与 magic number `[REVIEW]`（新增值靠评审 + allowlist） |
| 字体           | `font-heading` 只用于页面 h1、品牌“墨栈”、竖排题注；`font-sans` 正文；`font-mono` 只用于英文技术标签、坐标、状态、计数；不使用 `font-display`；禁 `next/font`、主题外字体栈/`font-family`/`font-[…]`；中文正文不用 mono 大字距；坐标四位补零。                                                                                                                                                                                                                                                                                                                                                                              | `next/font`/`font-family`/`font-display`/`font-[…]` `[CI]`；角色使用 `[REVIEW]`                 |
| 布局           | 页面一律 `CanvasShell` → 单个 `Artboard`，不得自建 chrome；`global-error` 例外自带 `globals.css`。固定 56px 顶栏、36px 底栏、8px 标尺（`<sm` 隐藏）、24px 点阵、`max-w-6xl/gap-6`、`lg` 两栏 `48rem + 220px`；aside 在 `<lg` 下移；Artboard 虚线 `-inset-2`、四角 `size-2`、标题带 `px-4 py-2`、内容 `p-6 sm:p-10`；题注 `<sm` 隐藏；断点只用 `sm`/`lg`。                                                                                                                                                                                                                                                                   | 入口/`@source` `[CI]`；布局使用 `[REVIEW]`                                                      |
| 签名与动效     | 每页恰一个画板（default/error/loading）；笔触用现有 `BrushStroke` SVG，不改 path，每页≤1 且只压主句关键词；竖排题注可选、单行、带印章红方点。入场动画白名单：`artboard-in`、`handle-in`、`ink-in`、`brush-reveal`；加载态额外允许 `animate-pulse` 与共享库动效；除加载态外不允许无限动画；全部尊重 `prefers-reduced-motion`，pulse 用 `motion-reduce:animate-none`。                                                                                                                                                                                                                                                        | 动画白名单/时长/缓动 `[CI]`；每页一个画板/笔触位置 `[REVIEW]`                                   |
| 暗色           | 只跟随 `prefers-color-scheme`；允许 `dark:` 变体；应用禁 `.dark` 类、`setTheme`、`ThemeProvider`、`ModeToggle`；`packages/ui` 可保留导出，但应用不得引用；禁止第二处暗色令牌。                                                                                                                                                                                                                                                                                                                                                                                                                                              | 应用内主题切换 `[CI]`（只扫 apps）；令牌重复 `[REVIEW]`                                         |
| 文案与可访问性 | 中文为主、动作与结果同名（重试/返回首页）、错误说明发生了什么与如何恢复、空/加载写状态；技术标签用等宽英文大写，坐标固定 `x 0000 y 0000 · 100%`；每页一个 h1（`loading` 作为状态区豁免）；装饰元素 `aria-hidden`，loading 用 `role=status`，焦点可见，信息性正文对比度 ≥ 4.5:1，`muted/70` 只用于装饰。                                                                                                                                                                                                                                                                                                                     | 全部 `[REVIEW]`；`role=status`/`aria-hidden` 由组件测试覆盖                                     |
| 风格定调       | 一句话“每页都是制图桌上的一张纸，不是一块仪表盘”；五条定调：纸面非卡片墙、工具可见、一处朱砂、三种字、落笔即静；是/不是对照表；五张参考页（`/`、`not-found`、`error`、`loading`、`global-error`）；新页面先对照再动手。                                                                                                                                                                                                                                                                                                                                                                                                     | 内容与参考页 `[REVIEW]`；页面骨架 `[CI:LAYOUT-03]`                                              |
| 组件写法       | 分层：`packages/ui` 通用原语 / `_components` 页面组合 / 页面只组合；`_components` 命名导出、禁 `React.FC`、接收 props 的组件声明 `<Name>Props`；`className` 最后并用 `cn()`；变体用语义 `tone`；默认 Server Component；四种状态同一套画板；测试放 `apps/shell/test/app/`；附组件清单与页面骨架图。                                                                                                                                                                                                                                                                                                                          | 导出/props `[CI:COMP-01/02]`；分层/变体/状态 `[REVIEW]`                                         |
| 变更流程       | 新增、重命名或改变语义的令牌/字体/布局常量/动效/组件骨架/组件清单时，同一变更更新契约与令牌；仅调整既有令牌值不改契约。规则必须使用稳定 ID 并标注 `[CI:<id>]` 或 `[REVIEW:<id>]`；`[CI:<id>]` 规则必须在 `check-style.mjs` 有同名检查；allowlist 只写精确路径/正则、原因与移除条件，禁止目录级忽略与 `.*` 全文件豁免；UI 变更写明风格影响。                                                                                                                                                                                                                                                                                 | 契约章节、ID 映射与 allowlist 结构 `[CI]`；内容质量与令牌变更策略 `[REVIEW]`                    |

原始色值与完整字体栈只留在令牌文件；契约引用变量名，避免两处数值同步。

### 2.1 契约文件骨架

`apply` 时直接写 `.claude/rules/design-system.md`；该文件是唯一版本，不在 design.md 复制第二份。骨架要求固定为：十节标题、规则短句、每条带 `[CI:<id>]` 或 `[REVIEW:<id>]`、值只引用令牌名；风格定调在最前，组件写法在布局之后，变更流程在最后。

### 2.2 规则 ID 与检查映射

| 规则 ID        | 检查器行为                                                          | 执行   |
| -------------- | ------------------------------------------------------------------- | ------ |
| `COLOR-01`     | 扫描颜色字面量                                                      | `[CI]` |
| `COLOR-02`     | 扫描 Tailwind 调色板类                                              | `[CI]` |
| `COLOR-03`     | 扫描任意色值、内联颜色、令牌外同名变量                              | `[CI]` |
| `FONT-01`      | 扫描 `next/font` 与主题外 `font-family`                             | `[CI]` |
| `FONT-02`      | 扫描 `font-display` 与 `font-[…]`                                   | `[CI]` |
| `VALUE-01`     | 分别扫描时长/延迟白名单、`s` 单位与 Tailwind `duration-*`/`delay-*` | `[CI]` |
| `LAYOUT-01`    | 检查共享样式入口与 `@source`（先剥离注释）                          | `[CI]` |
| `VALUE-04`     | 检查 shell 的圆角与阴影白名单                                       | `[CI]` |
| `SURFACE-01`   | 检查 shell 的渐变/玻璃/发光                                         | `[CI]` |
| `LAYOUT-03`    | 检查路由页骨架、chrome 与 global-error 的 html/body                 | `[CI]` |
| `STATE-01`     | 检查 error/loading/not-found 的画板、role 与返回入口                | `[CI]` |
| `MOTION-01`    | 检查 `@keyframes`/`animation` 白名单与 pulse 配对                   | `[CI]` |
| `SIGNATURE-01` | 检查每页笔触与题注数量                                              | `[CI]` |
| `SIGNATURE-02` | 检查 BrushStroke 的固定 path                                        | `[CI]` |
| `COMP-01`      | 检查 `_components` 命名导出与路由页 default export                  | `[CI]` |
| `COMP-02`      | 检查箭头/函数组件的 `<Name>Props` 类型与绑定                        | `[CI]` |
| `DARK-01`      | 检查 apps 内 `.dark`/`setTheme`/`ModeToggle`/`ThemeProvider`        | `[CI]` |
| `COPY-04`      | 检查路由页单 h1 与 loading 不写 h1                                  | `[CI]` |
| `BUILT-01`     | 检查 shell 产物的共享令牌与关键类                                   | `[CI]` |
| `BUILT-02`     | 检查 canvas 产物的共享令牌与关键类                                  | `[CI]` |
| `CONTRACT-01`  | 检查契约十节标题                                                    | `[CI]` |
| `CONTRACT-02`  | 检查 `[CI:<id>]` 映射与 ID 唯一性                                   | `[CI]` |
| `CONTRACT-04`  | 检查 allowlist 字段、`.*` 全文件豁免与过期条目                      | `[CI]` |

其余 `IDENTITY-01..06`、`COLOR-04/05`、`VALUE-02/03`、`FONT-03`、`LAYOUT-02`、`COMP-03..09`、`MOTION-02`、`DARK-02`、`COPY-01/02/03`、`CONTRACT-03/05/06/07` 标为 `[REVIEW]`，由 OpenSpec 评审覆盖。

### 3. 检查器用 `scripts/check-style.mjs`，源码与产物两段

源码段：

- 扫描 `apps/shell/src`、`apps/canvas/src`、`packages/ui/src` 与两个 CSS 入口；跳过令牌文件、`public`、`test`、`dist`。
- 扫描前剥离 `//`、`/* */` 与 CSS 注释，避免注释里的反例误报。
- 颜色：完整色值边界；调色板类按 `bg|text|border|ring|fill|stroke-<palette>-<shade>` 匹配；任意色值 `\[#...\]`；内联 `style` 中的颜色属性；令牌文件外的 `--token:` 重复定义。
- 字体：`next/font`、`font-family:`、`font-display`、`font-[…]`。
- 动效：`@keyframes` 名称、`animation`/`animation-name`、`animation-duration`/`delay`、`transition-duration`；白名单外失败。`animate-pulse` 与共享库动效允许。
- 暗色：只扫 `apps` 中的 `.dark` 选择器、`setTheme`、`ModeToggle`、`ThemeProvider`；`packages/ui` 的导出本身不报错。
- 入口：shell CSS 必须导入 `@inkstack/ui/globals.css`，并有 `@source` 指向 `packages/ui/src` 与 `../**/*.{ts,tsx}`；canvas CSS 必须导入共享入口并有 `@source` 指向 `packages/ui/src`。
- 结构与一致性：路由页必须 `CanvasShell` + 恰好一个 `Artboard`、不得自建 `header/footer/aside`；`global-error` 自带 `<html>/<body>`；状态页检查 `tone`、`role=status` 与返回入口；每页最多一个 `BrushStroke` 与一处 `annotation`，笔触 path 固定；路由页恰好一个 `<h1>`（`loading` 不写）；`_components` 禁止 default export 与 `React.FC`，接收 props 的 PascalCase 组件必须有 `<Name>Props` 并绑定；shell 只允许 `rounded-full`/`rounded-none`、`shadow-lg`/`shadow-md`，禁止渐变、玻璃与发光；`animate-pulse` 只允许 loading 且必须配对 reduced-motion。
- 契约：解析 `.claude/rules/design-system.md`，要求十节标题存在；解析每条规则的 `[CI]`/`[REVIEW]` 标记；每个 `[CI]` 规则在检查器中有对应检查 id。

产物段 (`--built`)：

- 递归读取 shell 的 `.next/static/**/*.css` 与 canvas 的 `dist/**/*.css`。
- shell 必须含 `--seal`、`--background`、`min-h-dvh`、`.font-heading`；canvas 必须含 `--seal`、`--background`、`bg-primary`。
- 用选择器/变量边界匹配，不用裸子串；找不到产物时明确报期望路径，而不是静默跳过。

脚本提供 `--self-test`，用内存样例覆盖每条规则与干净样例；`check:styles` 先跑 self-test 再扫描仓库。输出统一为“扫描文件数 / 错误数 / 文件:行 + 修复建议”，失败退出 1。

Allowlist 结构固定为 `{ file, pattern, reason, removeWhen }`，只允许精确路径/正则；禁止目录级忽略、`.*` 全文件豁免（令牌文件除外）与过期条目。当前 allowlist 为空：令牌文件与 `public` 资产本来就不在扫描范围，`Canvas.tsx` 的几何、页面 `animationDelay`、`in_oklch` 与 `loading` 的 pulse 都能通过规则本身，不需要整行豁免。

### 4. 接入 `pnpm verify` 与 CI

- 根 `package.json`：新增 `check:styles`（self-test + 源码）与 `check:styles:build`（产物）。
- `verify` 链：`check:docs` 之后加 `check:styles`；`build` 之后加 `check:styles:build`。
- `ci-static.yml`：在 `Check agent docs` 之后加 `Check style contract` 步骤。
- `ci-build.yml`：在 `Build` 之后加 `Check built styles` 步骤。
- `ci.yml` 的 `all-checks-passed` 已依赖 static/build，无需新增 job 或 required check。
- `docs/ci-cd.md` 增补两项检查的说明，避免 CI 蓝图与工作流漂移。

### 5. 修复审查发现的冲突

- **品牌字**：`font-heading` 明确包含品牌“墨栈”（`canvas-shell.tsx:42`），不只 h1。
- **加载动效**：白名单包含 `animate-pulse`（`loading.tsx`），否则当前 tree 会失败。
- **暗色扫描**：主题切换检查只扫 `apps`；`packages/ui` 的 `ModeToggle` / `ThemeProvider` 导出不算违规，只禁止应用引用。
- **原始色值范围**：限定为“样式源码”，`public/*.svg` 等资产豁免，避免“全仓库”表述与事实不符。
- **印章红与错误红**：当前同值但语义分离，契约明确不得把 `--seal` 当错误色或把 `--destructive` 当品牌色。
- **loading 的 h1**：`loading.tsx` 是状态区，不是页面，豁免“每页一个 h1”，用 `role=status` 表达状态。
- **内联样式**：只禁止内联颜色，不禁止几何定位与动画延迟；`Canvas.tsx` 与动画延迟无需改代码。
- **只有边界没有风格**：第一版契约只有禁令和常量，无法阻止“今天工作台、明天仪表盘”。补上风格定调（一句话、五条原则、是/不是、参考页）与组件写法（分层、导出、props、tone、状态、测试、组件清单），并把页面骨架、表面、签名、单 h1 变成 `[CI]`。
- **组件两种写法**：`_components` 统一命名导出与 `<Name>Props`；`BrushStroke` 的内联 props 提取为 `BrushStrokeProps`，渲染不变。

## Risks / Trade-offs

- [正则误报：`href="#abc"`、URL、id、`dark:` 被 `.dark` 命中] → 剥离注释；`.dark` 要求类选择器/`classList` 上下文；颜色要求完整色值边界；self-test 覆盖正反例。
- [一刀切禁任意值/魔法数会打爆当前树并阻塞 shadcn] → 间距与字号先标 `[REVIEW]`，只对动效、颜色、字体做 `[CI]`；新增值走 allowlist。
- [契约与令牌漂移] → 契约只引用令牌名；十节标题与 `[CI]` 映射由检查器校验；内容质量靠评审。
- [产物检查依赖构建路径] → 路径写死为 Next 的 `.next/static` 与 Rspack 的 `dist`；布局变更时明确报“找不到产物”。
- [`ModeToggle` / `ThemeProvider` 仍被导出] → 本次只禁止应用使用；后续变更再决定删除它们与 `next-themes`。
- [CI 运行时间增加] → 源码检查只读文本，产物检查只读 CSS；都在现有 job 内追加步骤。
- [样式契约过长导致 AI 忽略] → 契约按十节表格写，规则短句化；风格理由留在本 design 与归档。
- [机械检查过严会限制设计] → 只锁可判定的骨架与表面；风格判断留 `[REVIEW]`；需要例外时先改契约与 allowlist，不绕过检查。

## Migration Plan

1. 写契约十节与根 `AGENTS.md` 入口，跑 `pnpm check:docs`。
2. 写检查器、self-test 与 allowlist，跑 `pnpm check:styles`，确认当前树通过。
3. 接入 `verify`、`docs/ci-cd.md` 与两个 CI 工作流。
4. 构建后跑 `pnpm check:styles:build`。
5. 负样例验证：临时写入硬编码颜色/调色板类/未列动效，确认检查失败，再移除。
6. 回滚只需移除新增脚本与 CI 步骤；契约文件可独立保留，不影响运行时。

## Open Questions

- 是否在后续变更中删除未使用的 `ModeToggle` / `ThemeProvider` 与 `next-themes`？当前只禁止应用使用。
- 是否把现有 9/10/11px、`0.62em`、字距等任意值进一步固化成令牌？本次允许但非必需，视觉不变。
- canvas 自己的 tldraw 视觉是否需要单独契约？当前认为 tldraw 是第三方画布，不纳入应用级样式约束。
