# Tasks

## 1. 契约与现状审计

- [x] 1.1 新增 `.claude/rules/design-system.md`，前置 `paths: apps/shell/**, apps/canvas/**, packages/ui/**`，按十节写入风格定调、颜色、数值与间距、字体、布局、组件写法、签名与动效、暗色、文案与可访问性、变更流程；每条规则使用稳定 ID 并标注 `[CI:<id>]` 或 `[REVIEW:<id>]`；用 `rg '^## ' .claude/rules/design-system.md` 确认十节齐全，用 `rg '\[(CI|REVIEW):[A-Z]+-[0-9]+'` 确认 ID 格式。
- [x] 1.2 在根 `AGENTS.md` 增加一行指向 `.claude/rules/design-system.md` 的入口；运行 `pnpm check:docs` 通过，且契约文件能从根 `AGENTS.md` 到达。
- [x] 1.3 更新 `docs/ci-cd.md` 与根 `AGENTS.md` 的 `pnpm verify` 说明，写明 `check:styles` / `check:styles:build` 的位置与失败语义；运行 `pnpm check:docs` 通过。
- [x] 1.4 审计当前树并记录到契约/设计：确认 `public/*.svg` 属于资产豁免、应用未引用 `ModeToggle` / `ThemeProvider`、`font-heading` 包含品牌字、`loading` 的 `animate-pulse` 在白名单、`--seal` 与 `--destructive` 同值但语义分离；用 `rg` 核对后确认 `pnpm check:styles` 不会误报。

## 2. 样式检查器

- [x] 2.1 新增 `scripts/check-style.mjs` 源码检查：颜色字面量、调色板类、任意色值、内联颜色、令牌外同名变量、`next/font`、主题外 `font-family`、`font-display`、`font-[…]`、应用内 `.dark` / `setTheme` / `ModeToggle` / `ThemeProvider`、共享样式入口与 `@source`、动效白名单、契约十节、`[CI:<id>]` 映射与 ID 唯一性；扫描前剥离注释，输出文件:行与修复建议。
- [x] 2.2 实现 `--self-test`：为每条规则准备命中样例与一条干净样例，并覆盖重复 ID、缺少 `[CI:<id>]` 对应检查、allowlist 缺字段三类契约错误；运行 `node scripts/check-style.mjs --self-test` 全部通过，并确认任一样例缺失时 self-test 失败。
- [x] 2.3 实现 `--built` 产物检查：shell 的 `.next/static/**/*.css` 必须含 `--seal`、`--background`、`min-h-dvh`、`.font-heading`，canvas 的 `dist/**/*.css` 必须含 `--seal`、`--background`、`bg-primary`；找不到产物时明确报期望路径。
- [x] 2.4 实现 allowlist 审计：条目必须包含 `file`、`pattern`、`reason`、`removeWhen`；目录级忽略直接报错；当前豁免（令牌文件、`public`、`Canvas.tsx` 几何、`animationDelay`、`in_oklch`、加载 pulse）逐条写入并说明移除条件。
- [x] 2.5 在根 `package.json` 增加 `check:styles`（self-test + 源码）与 `check:styles:build`（产物），把前者接入 `verify` 的 `check:docs` 之后、后者接入 `build` 之后；运行 `pnpm check:styles` 通过，构建后运行 `pnpm check:styles:build` 通过。

## 3. CI 验收

- [x] 3.1 在 `.github/workflows/ci-static.yml` 的 `Check agent docs` 之后增加 `Check style contract` 步骤执行 `pnpm check:styles`；运行 `pnpm format:check` 通过，YAML 缩进与现有步骤一致。
- [x] 3.2 在 `.github/workflows/ci-build.yml` 的 `Build` 之后增加 `Check built styles` 步骤执行 `pnpm check:styles:build`；运行 `pnpm format:check` 通过，确认失败会阻断该 job。
- [x] 3.3 确认 `ci.yml` 的 `all-checks-passed` 已依赖 static/build，无需新增 job 或 required check；两项检查失败会让聚合 job 失败。

## 4. 集成与负样例

- [x] 4.1 依次运行 `pnpm format`、`pnpm check:docs`、`pnpm check:styles`、`pnpm build`、`pnpm check:styles:build`，确认全部通过并记录实际输出。
- [x] 4.2 在 dev server 停止后运行 `pnpm verify`，确认 lint、manifest、docs、typecheck、coverage、build、format、hygiene 与两项样式检查全部通过；若 dev server 仍在运行，先说明无法执行 build 的原因，不要直接覆盖 `.next`。
- [x] 4.3 确认本次未改变视觉：`packages/ui/styles/globals.css` 的令牌值、shell/canvas 页面与文案保持现状；如新增字号/字距令牌，只固化现有任意值，渲染结果不变；`git status --short` 只出现本变更预期的规则、脚本、清单、CI、文档与 OpenSpec 文件。
- [x] 4.4 负样例验收：临时在 shell 页面加入一个硬编码颜色、一个调色板类、一个未列动效，运行 `pnpm check:styles` 确认三项分别失败并给出文件:行；移除临时改动后再次运行确认通过，不提交负样例。

## 5. 风格定调与组件写法

- [x] 5.1 在契约新增“风格定调”节：一句话方向、五条原则、是/不是对照表、五张参考页；新增“组件写法”节：分层、导出、props、tone、状态、测试与组件清单；契约改为十节，检查器 `requiredSections` 同步。
- [x] 5.2 新增 CI 检查：`LAYOUT-03` 页面骨架与 chrome、`SIGNATURE-01` 笔触/题注数量、`VALUE-04` 直角与阴影、`SURFACE-01` 渐变/玻璃、`COMP-01` 导出、`COMP-02` Props 类型、`COPY-04` 单 h1；`--self-test` 覆盖正反例。
- [x] 5.3 提取 `BrushStrokeProps`，保持渲染不变；确认 `pnpm check:styles` 对当前树通过。
- [x] 5.4 同步 OpenSpec 的 proposal/spec/design、`docs/ci-cd.md` 与根 `AGENTS.md` 的“十节/组件写法”表述。
- [x] 5.5 负样例：临时加入 `rounded-lg`、`backdrop-blur`、两个 `BrushStroke`、`_components` default export，确认分别触发 `VALUE-04`、`SURFACE-01`、`SIGNATURE-01`、`COMP-01`；移除后恢复。
- [x] 5.6 跑 `pnpm check:styles`、`pnpm check:docs`、`pnpm lint`、`pnpm typecheck`，记录实际输出。

## 6. 子 agent 审查与查漏补缺

- [x] 6.1 派三个子 agent 分别审查权重性、覆盖点与可用性；确认审查期间无临时探针残留，基线 `check:styles` 为 20 个文件、0 error。
- [x] 6.2 修复检查器硬伤：`LAYOUT-01` 先剥离注释、移除整行 allowlist 短路、`COMP-02` 支持箭头函数/`interface`/嵌套 `_components`/PascalCase 过滤、文件级报错行号、正文类名误报、内联 `var()` 颜色、命名色、任意值渐变、`VALUE-01` 时长/延迟分离与 `s`/Tailwind 类、`animate-pulse` 只允许 loading 且必须配对 reduced-motion、`STATE-01`、`SIGNATURE-02`。
- [x] 6.3 同步契约与文档：适用范围、`LAYOUT-02`/`MOTION-02`/`COPY-03` 去重、`STATE-01`/`SIGNATURE-02`/`BUILT-01/02`、allowlist 禁止 `.*` 与过期条目、`CONTRACT-07` 的 `style-review.md`、单一归属表与 `packages/ui/AGENTS.md` 指针。
- [x] 6.4 重跑 `pnpm check:styles`、`pnpm check:docs`、`pnpm lint`、`pnpm typecheck`、`pnpm format:check`，并对至少 5 类新绕过做负样例验证；实际负样例命中 `COMP-01`/`COMP-02`/`STATE-01`/`COLOR-03`/`VALUE-01`/`SURFACE-01`/`MOTION-01`/`SIGNATURE-01`，清理后跑完 `pnpm verify`，退出 0。

## Workflow follow-up

- 变更评审通过并完成 `pnpm verify` 后归档，确认 `openspec/specs/ui-system/spec.md` 增加五项要求。
- 是否删除未使用的 `ModeToggle` / `ThemeProvider` 与 `next-themes`，留给后续变更决定；本变更只禁止应用使用。
- 是否把现有 9/10/11px、`0.62em`、字距等任意值进一步固化成令牌，留给后续变更；本变更只允许，不强制。
