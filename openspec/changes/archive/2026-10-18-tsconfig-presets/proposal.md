# Proposal

## Why

当前的 `@inkstack/config` 名字过宽：它只承载 tsconfig，却容易被继续塞入 vitest、lint、bundler 预设，最终变成杂物间。同时，tsconfig 的现有结构有三个具体问题：

- `tsconfig.base.json` 带着 `module: ESNext` + `moduleResolution: bundler`，Node 包如果选错预设会静默使用 bundler 解析，与 Node 运行时不一致。
- `packages/contracts` 是仓库里唯一的 CommonJS 包，而 Nest 12、AI SDK、Next 都在 ESM 侧；BFF 也确定使用 Nest。
- 缺少 Nest、Next、library 预设，BFF / gateway / shell 落地时会各自临时拼配置。

现在只有 contracts 一个消费者，改名和 ESM 迁移成本最低。

## What Changes

- **BREAKING（仅仓库内部）**：`packages/config` 重命名为 `packages/tsconfig`，包名 `@inkstack/config` 改为 `@inkstack/tsconfig`；预设文件名去掉 `tsconfig.` 前缀，改为 `base.json` / `node.json` / `react.json` 等。
- 新增 `nest.json`、`next.json`、`library.json` 预设；`base` 只保留语言与严格性，`module` / `moduleResolution` 由各平面自行声明。
- `packages/contracts` 改为 ESM（`"type": "module"`），并改用 `@inkstack/tsconfig/library.json`。
- `scripts/check-manifests.mjs` 增加两项检查：有 `tsconfig.json` 的包必须继承 `@inkstack/tsconfig/*.json` 并声明该包的 `workspace:*` 依赖；有 `src/` 的包必须是 `"type": "module"`。
- 新增 `docs/typescript.md`，作为 tsconfig 预设、模块格式与构建约定的唯一 home；同步更新 `AGENTS.md`、`docs/AGENTS.md`、`docs/package-metadata.md`、`docs/toolchain.md`、`README.md`。
- `README.md` 中 BFF 的"框架待定"更新为 NestJS。

明确不在本次范围：根 `tsconfig.json` 与 project references、vitest / vite 预设、gateway / bff / shell / canvas 的应用级 tsconfig、Nest / Next / React 运行时依赖、Node 升级、以及 `docs/architecture/source` 与交互图的 BFF 更新。

## Capabilities

### New Capabilities

无。本变更只涉及工具链与文档，不改变系统运行时行为，`.openspec.yaml` 已设置 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 包结构：`packages/config` → `packages/tsconfig`；`@inkstack/config` → `@inkstack/tsconfig`。
- 模块格式：`@inkstack/contracts` 从 CommonJS 改为 ESM，构建产物格式变化，但无外部消费者。
- 依赖清单与 `pnpm-lock.yaml` 更新；不新增运行时依赖。
- 文档：新增 `docs/typescript.md`，修改四份既有文档与 `README.md`。
- 工具链检查：`pnpm check:manifests` 规则增加，现有包需满足新规则。
