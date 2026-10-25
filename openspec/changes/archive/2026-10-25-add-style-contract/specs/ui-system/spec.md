# Spec Delta

## ADDED Requirements

### Requirement: AI 可读的视觉样式契约

Shell、canvas 与共享 UI 的视觉样式 SHALL 由 `.claude/rules/design-system.md` 定义；该文件 MUST 按路径加载、从根 `AGENTS.md` 可达，并覆盖风格定调、颜色、数值与间距、字体、布局、组件写法、签名与动效、暗色、文案与可访问性、变更流程十节；风格定调 MUST 包含一句话方向、五条定调、是/不是对照表与参考页。

#### Scenario: 编辑相关路径时加载契约

- **WHEN** AI 编辑 `apps/shell/**`、`apps/canvas/**` 或 `packages/ui/**`
- **THEN** 样式契约按 `paths` 自动加载
- **AND** 根 `AGENTS.md` 提供到该契约的入口

#### Scenario: 契约十节齐全

- **WHEN** `pnpm check:styles` 读取契约文件
- **THEN** 风格定调、颜色、数值与间距、字体、布局、组件写法、签名与动效、暗色、文案与可访问性、变更流程十节标题都存在
- **AND** 缺少任一节时检查失败

#### Scenario: 风格定调可读

- **WHEN** 阅读契约的风格定调
- **THEN** 包含一句话方向、五条定调、是/不是对照表与五张参考页
- **AND** 新页面在实现前对照参考页

#### Scenario: 令牌只有一个来源

- **WHEN** 查看颜色与字体定义
- **THEN** 样式源码中的原始色值与字体栈只存在于 `packages/ui/styles/globals.css`
- **AND** 契约引用语义令牌名，而不是复制第二份色值

#### Scenario: 契约可被检查器识别

- **WHEN** 执行 `pnpm check:docs`
- **THEN** 契约文件具有非空 `paths`
- **AND** 该文件能从 `AGENTS.md` 到达

### Requirement: 源码样式约束由 CI 验收

`pnpm check:styles` SHALL 检查应用与共享组件源码中的样式违规，并在违规时以非零状态退出；CI 的 static 作业 MUST 执行该检查。检查 MUST 覆盖颜色（含命名色与任意值）、字体、动效白名单与时长/延迟分离、暗色、样式入口（含注释剥离）、契约章节、页面骨架、状态页画板、组件导出与 props、工作台表面、签名与固定笔触 path、单 h1。

#### Scenario: 颜色字面量、调色板类与任意色值被拒绝

- **WHEN** 源码出现十六进制、`rgb()`、`hsl()`、`oklch()` 字面量，或 `bg-red-500`、`text-white`、`border-gray-*` 等 Tailwind 调色板类，或 `[#...]` 任意色值、内联 `style` 颜色、令牌文件外的同名 CSS 变量
- **THEN** 检查失败并指出文件与行
- **AND** 提示改用语义令牌

#### Scenario: 主题外字体被拒绝

- **WHEN** 出现 `next/font` 导入、令牌文件之外的 `font-family`、`font-display` 或 `font-[…]`
- **THEN** 检查失败并指出文件与行

#### Scenario: 动效白名单外被拒绝

- **WHEN** 出现 `artboard-in`、`handle-in`、`ink-in`、`brush-reveal`、加载态 `animate-pulse` 之外的动画，或白名单外的时长、延迟、缓动
- **THEN** 检查失败并指出文件与行

#### Scenario: 手动主题切换被拒绝

- **WHEN** 应用代码出现 `.dark` 类切换、`setTheme`、`ModeToggle` 或 `ThemeProvider`
- **THEN** 检查失败
- **AND** `packages/ui` 的导出本身不报错，但应用不得引用

#### Scenario: 样式入口与扫描来源缺失

- **WHEN** shell 或 canvas 的 CSS 缺少对 `@inkstack/ui/globals.css` 的导入，或缺少共享组件/应用源码的 `@source` 声明
- **THEN** 检查失败并指出缺失项

#### Scenario: 扫描范围与豁免明确

- **WHEN** 执行源码检查
- **THEN** 扫描 `apps/shell/src`、`apps/canvas/src`、`packages/ui/src` 与两个 CSS 入口
- **AND** 令牌文件、`public` 资产、`test` 与 `dist` 不计入
- **AND** 暗色切换只扫描 `apps`

#### Scenario: 当前仓库通过

- **WHEN** 在干净的工作区执行 `pnpm check:styles`
- **THEN** 检查通过
- **AND** 唯二允许出现原始色值的样式源码位置是令牌文件

### Requirement: 构建产物样式由 CI 验收

`pnpm check:styles:build` SHALL 检查 shell 与 canvas 的 production 构建产物包含共享主题令牌与关键工具类；CI 的 build 作业 MUST 在构建后执行该检查，产物缺失时 MUST 显式失败。

#### Scenario: shell 产物包含共享与页面样式

- **WHEN** shell 的 production 构建完成
- **THEN** 产物 CSS 包含 `--seal`、`--background`、`min-h-dvh` 与 `.font-heading`
- **AND** 缺失时检查失败，防止再次出现无样式页面

#### Scenario: canvas 产物包含共享样式

- **WHEN** canvas 的 production 构建完成
- **THEN** 产物 CSS 包含 `--seal`、`--background` 与 `bg-primary`
- **AND** 缺失时检查失败

#### Scenario: 产物缺失不静默通过

- **WHEN** 找不到 shell 或 canvas 的 CSS 产物
- **THEN** 检查以非零状态失败并说明期望路径

#### Scenario: 检查失败阻断合并

- **WHEN** `check:styles` 或 `check:styles:build` 失败
- **THEN** 对应的 CI 作业失败
- **AND** PR 的 required check 不能通过

### Requirement: 契约规则与检查保持一致

契约中的每条规则 MUST 使用稳定 ID，并标注 `[CI:<id>]` 或 `[REVIEW:<id>]`；`[CI:<id>]` 规则 MUST 在 `check-style.mjs` 有同名检查。新增、重命名或改变语义的令牌/字体/布局常量/动效/组件骨架/组件清单 MUST 同步更新契约；仅调整既有令牌值不需要改契约。

#### Scenario: CI 规则必须有检查

- **WHEN** 契约把一条规则标为 `[CI:<id>]`
- **THEN** `check-style.mjs` 中存在同名检查
- **AND** 缺少对应检查时 `pnpm check:styles` 失败

#### Scenario: 规则 ID 唯一

- **WHEN** 契约中出现重复的规则 ID
- **THEN** `pnpm check:styles` 失败并指出重复项

#### Scenario: 评审规则必须显式标注

- **WHEN** 一条规则无法机械检查
- **THEN** 契约把它标为 `[REVIEW:<id>]`
- **AND** 不得默认当作已由 CI 覆盖

#### Scenario: 仅调整令牌值

- **WHEN** 只改变既有令牌的值，不改变名称与语义
- **THEN** 契约无需更新
- **AND** 视觉变化仍按 OpenSpec 评审

#### Scenario: Allowlist 必须可审计

- **WHEN** 检查器需要豁免某个文件或写法
- **THEN** allowlist 条目包含精确路径/正则、原因与移除条件
- **AND** 目录级忽略不被接受

### Requirement: 风格定调与组件写法有单一来源

视觉方向与组件写法 SHALL 写在契约中，并有可机械验收的骨架规则；新增页面与组件 MUST 按同一套写法实现，不得各写一套。

#### Scenario: 页面骨架一致

- **WHEN** 检查 `apps/shell/src/app/**` 下的路由页文件
- **THEN** 每个文件使用 `CanvasShell` 且恰好一个 `Artboard`
- **AND** 不直接写 `<header>`/`<footer>`/`<aside>`
- **AND** `global-error` 自带 `<html>/<body>`

#### Scenario: 组件写法一致

- **WHEN** 检查 `apps/shell/src/app/_components/**` 下的组件
- **THEN** 只用命名导出，不使用 `React.FC`
- **AND** 每个接收 props 的导出组件声明 `<Name>Props`
- **AND** 路由页文件有 default export

#### Scenario: 工作台表面一致

- **WHEN** shell 源码出现圆角、阴影、渐变、玻璃或发光
- **THEN** 只允许 `rounded-full`/`rounded-none`、`shadow-lg`/`shadow-md`
- **AND** 其他写法检查失败

#### Scenario: 签名克制

- **WHEN** 路由页出现多个 `BrushStroke`、多处题注或多个 `<h1>`
- **THEN** 检查失败
- **AND** `loading` 不写 `<h1>`

#### Scenario: 状态页一致

- **WHEN** `error`/`global-error` 缺少 `tone="error"`，`loading` 缺少 `tone="loading"` 或 `role="status"`，或 `not-found` 缺少 `href="/"`
- **THEN** 检查失败

#### Scenario: 动效只落在一处

- **WHEN** 非 `loading` 页面使用 `animate-pulse`，或 `loading` 的 pulse 没有配对 `motion-reduce:animate-none`
- **THEN** 检查失败

#### Scenario: UI 变更说明风格影响

- **WHEN** OpenSpec 变更涉及 UI
- **THEN** 变更说明写明风格影响（无 / 页面 / 元素 / 截图）
- **AND** 新增页面必须对照五张参考页
