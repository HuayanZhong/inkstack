# Design

## Context

- 仓库处于骨架阶段：`apps/*` 只有占位 `package.json`，实际代码集中在 `packages/contracts` 与 `scripts/`。
- `.npmrc` 设置了 `engine-strict=true`，依赖 engines 不满足时安装会直接失败。当前 Node 24.14.1；本变更选用的工具都满足该版本。
- 现有 `@inkstack/config` 只承载每个包 `extends` 的 tsconfig 预设；`turbo.json` 已定义 `dev` / `build` / `lint` / `typecheck`。
- 规划中的应用平面：`apps/shell`（Next 16）、`apps/canvas`（tldraw）、`apps/gateway`（Nest 12 ESM）、`apps/bff`（框架待定），以及后续 AI 包。
- 参考实现 dsh 的分解方式：tsconfig 按程序边界拆文件，lint 在一个文件内用 glob override，vitest 按测试类型拆。本设计沿用其"按约束分解"的原则，但不照搬 host/client 聚合与 `@stylistic` 方案。

## Goals / Non-Goals

**Goals:**

- 在应用代码进入前建立可执行的 format 与 lint 基线。
- 让仓库级规则只有一个 home：根目录；环境差异用路径表达。
- 让 Turborepo 的环境变量声明成为可检查的门禁，避免缓存键错误。
- 保持 Node 24.14.1 可安装、可运行，不阻塞后续独立升级。

**Non-Goals:**

- 不引入 vitest / vite 与测试预设；这是下一个独立变更。
- 不新增或修改 tsconfig 预设；`@inkstack/config` 本次不动。
- 不安装 Nest / Next / React / tldraw / AI SDK 等运行时依赖。
- 不接入 pre-commit hook、CI、Renovate。
- 不格式化 Markdown、YAML 和 `package.json`。

## Decisions

### 1. oxfmt 负责格式，oxlint 只负责正确性

- oxfmt 0.73.0 精确 pin；oxlint 配置中**不启用** `@stylistic/*` 规则。
- 替代方案：像 dsh 一样把格式折进 oxlint。拒绝原因：两个工具会同时修改引号、分号与换行，产生互相覆盖；oxfmt 的 `--check` 也比 lint 规则更适合作为格式门禁。
- 替代方案：Prettier。拒绝原因：仓库已选择 oxc 工具链，oxfmt 的 JS/TS 输出已对齐 Prettier，精确 pin 可控制 0.x 风险。

### 2. lint / format 配置放根目录，不抽到 `@inkstack/config`

- oxlint 与 oxfmt 都是从仓库根读取一次的仓库级政策，不是每个包必须主动 `extends` 的预设。
- 替代方案：放进 `@inkstack/config`。拒绝原因：每个包仍需在命令里写配置路径；配置包会同时承担"包级预设"和"仓库级政策"两种语义；当前没有外部消费者，发布成本没有收益。
- 环境差异由 `.oxlintrc.json` 的 `overrides[].files` 表达，不产生多份环境配置文件。

### 3. 按约束分解，而不是按环境分文件

- **tsconfig**：compilerOptions 是 program 级互斥项，必须用独立预设文件区分 Node / Nest / React / Next。此轨道不在本变更内。
- **lint**：规则差异可以用路径 glob 表达，保持单文件。
- **执行变体**：只有"调用方式不同"才拆文件——`.oxlintrc.turbo.json`（需要 workspace 根上下文）与将来的 `.oxlintrc.staged.json`（关闭 type-aware）。
- 替代方案：每个平面一份 `.oxlintrc.*.json` 并用 `extends` 串联。拒绝原因：基础规则重复、升级时容易漂移；当前规则量不足以需要拆分。

### 4. format 先于 lint 执行

- 先一次性格式化现有代码，再在稳定基线上跑 lint。
- 替代方案：先 lint 再 format。拒绝原因：两类改动混在同一 diff，review 无法区分"逻辑修复"与"格式重排"；部分 lint 结果会在格式化后自然消失。

### 5. oxlint 与 oxlint-tsgolint 精确 pin，按包运行 type-aware

- 两者都放 `toolchain` catalog，版本一起升级。
- `packages/contracts` 的 `lint` script 从包目录运行，使用 `--config ../../.oxlintrc.json --type-aware .`，让 tsgolint 命中该包自己的 tsconfig，同时保留 turbo 的包级缓存。
- 替代方案：从根目录统一跑。拒绝原因：失去 per-package 缓存；且未来各包 tsconfig 不同，根运行难以保证 project 归属。

### 6. `eslint-plugin-turbo` 通过 oxlint `jsPlugins` 接入

- 规则 `turbo/no-undeclared-env-vars` 检查 `process.env` / `import.meta.env` 是否声明在 `turbo.json`。
- 该规则需要 workspace 根上下文，放在独立的 `.oxlintrc.turbo.json`，由根命令从仓库根执行；不进入包级 lint。
- 插件的 `eslint` peer 通过 `peerDependencyRules.ignoreMissing` 忽略。依据：构建产物中 `eslint` 只出现在 `import type`，运行时不需要 ESLint。
- 替代方案：安装 ESLint 仅为运行该插件。拒绝原因：与 oxlint 选型冲突，且增加一套不必要的运行时。
- 替代方案：自己在 `check-manifests.mjs` 里扫描环境变量。拒绝原因：需要处理解构、`import.meta.env`、框架前缀和 dotenv，重复实现成本高且容易漏。

### 7. 初始规则范围保持克制

- 只启用显式列出的规则，不整体打开 `correctness` category。理由：oxlint 升级时 category 内容可能变化，显式列表让规则变化可见。
- Nest 平面预先关闭 `no-extraneous-class`、`no-useless-constructor`、`consistent-type-imports`。前两条会误伤 Nest Module 与纯注入构造函数；第三条会把值导入改成 `import type`，导致 `emitDecoratorMetadata` 丢失类引用。
- 替代方案：先开全量 category，再逐条压制。拒绝原因：压制注释会变成噪音，且新规则会随升级静默进入。

### 8. 格式化范围先只覆盖代码

- `**/*.{ts,tsx,mts,cts,js,mjs,cjs}`。
- 不格式化 Markdown / YAML / `package.json`。理由：中文文档有字数预算与链接检查；YAML 含手工注释；manifest 字段顺序不是当前目标。
- 替代方案：一次覆盖所有文本格式。拒绝原因：diff 不可审查，且可能破坏文档预算。

### 9. 根 `lint` 命令同时覆盖代码与 turbo env

- `lint` = `turbo run lint && oxlint --config .oxlintrc.turbo.json .`。
- 理由：一个入口覆盖两类检查，CI 接入时不需要记两个命令。
- 替代方案：保留两个独立命令。拒绝原因：容易只跑其中一个；turbo env 规则恰恰是"忘了就静默错缓存"的类型。

## Risks / Trade-offs

- **oxlint 的 JS 插件层仍是 alpha，且插件依赖 ESLint 9 的 `context.physicalFilename`** → 实现时先用一个未声明 env 的临时文件做 spike；若 API 缺失，优先加一个几行的 context 适配器，其次才考虑把该规则隔离到最小 ESLint 调用。
- **oxfmt / oxlint 处于 0.x / 1.x 快速迭代期** → 放 `toolchain` 精确 pin；升级作为独立动作，升级后必须跑 `format:check` 与 `pnpm lint` 并审查 diff。
- **type-aware lint 从包目录运行时可能找不到 tsconfig** → 验证 `packages/contracts`；若失败，退回根目录运行并记录原因，不写路径兼容层。
- **格式化现有代码会产生一次 diff** → 当前代码量很小；先 format、后 lint，两个 diff 分开提交。
- **`ignoreMissing: ["eslint"]` 掩盖了插件的真实依赖** → 已确认插件运行时只在类型层引用 ESLint；若未来插件改为运行时导入，安装期或 spike 会暴露，届时重新评估。
- **turbo 的框架前缀白名单会让部分变量不报错** → 文档中明确：白名单只用于降噪，缓存正确性仍以 `turbo.json` 的显式 `env` / `globalEnv` 声明为准。

## Migration Plan

1. 先只加入 oxfmt，运行 `pnpm format` 并确认 diff 仅包含代码文件。
2. 再加入 oxlint 基础配置与 `packages/contracts` 的 lint script，跑通后提交。
3. 最后加入 `eslint-plugin-turbo` 与 `lint:env`，用临时 fixture 验证"未声明 env 必须报错"。
4. 回滚方式：移除对应 catalog 条目与配置，执行 `pnpm install`；不涉及数据或运行时迁移。

## Open Questions

- 是否在后续加入 `.oxlintrc.staged.json` 与 pre-commit hook，取决于完整 lint 稳定后的实际提交体验，不影响本次结构。
- 是否把格式化范围扩展到 JSON / YAML / Markdown，等代码基线稳定并验证中文 Markdown 换行行为后再定。
