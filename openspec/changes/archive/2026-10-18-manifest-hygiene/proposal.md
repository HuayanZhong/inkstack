# Proposal

## Why

`package.json` 的元数据和依赖版本目前全靠手写：6 个包没有 `description` 和 `license`，根描述模糊，catalog 只有一个 `dev`，`AGENTS.md` 声称 TypeScript 固定 `6.0.3` 而 catalog 是 `^6.0.3`。随着 Next / tldraw / Nest 等运行时依赖进入，这些问题会放大。需要一个轻量的 manifest 规则和本地检查，但不触碰尚未决定的 tsconfig / lint / format 配置分发，也不提前设计发布版本。

## What Changes

- 新增 `docs/package-metadata.md` 作为唯一 home：三层版本、catalog 分类、字段标准、description 规则、检查规则，以及"tsconfig / lint / format 分发属于后续决策"的非目标说明。
- 更新 7 个 manifest：
  - 根 `description` 换成具体的一句话；
  - 6 个包补 `description` 和 `license: ISC`；
  - `packages/config` 只补 `description` / `license`，不碰 `exports`、`files`、`scripts`、`tsconfig`；
  - 不改变任何包版本。
- 拆分 pnpm catalog：
  - `toolchain`：`typescript` 精确 `6.0.3`、`@fission-ai/openspec` 精确 `1.14.3`；
  - `dev`：turbo、commitlint、`@commitlint/config-conventional`、husky、`@types/node`，以及检查脚本需要的 `yaml`；
  - `runtime`：占位注释，等 Next / tldraw / Nest / AI SDK 进入。
- 更新根 `package.json` 的 `catalog:*` 引用；更新根 `AGENTS.md` 的安装命令和 TypeScript 固定口径；在 `docs/AGENTS.md` 权威表加一行指向新文档，必要时压缩一条现有规则以保持 ≤25 行。
- 新增 `scripts/check-manifests.mjs` 和根脚本 `pnpm check:manifests`，检查：
  - 名称、`private`、`description`、`license`；
  - 外部依赖只允许 `catalog:*`，内部依赖只允许 `workspace:*`；
  - `toolchain` catalog 必须是精确版本；
  - `.nvmrc`、`engines.node`、`packageManager`、`devEngines` 一致；
  - 私有包版本保持 `0.0.0`（warning，不阻塞）；
  - 根 scripts 存在；有 `src` 的包有 `build` / `typecheck`；apps 与 config 暂不强制。
- 明确不检查：tsconfig 继承、lint / format、字段顺序、包的 `type`、架构 `source/*.json`。
- **BREAKING**：无。仅元数据、依赖声明、脚本与文档。

## Capabilities

### New Capabilities

无。这是纯 manifest / 工具链 / 文档变更，不改变运行时行为；`.openspec.yaml` 已设置 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 配置：根 `package.json`、`apps/*/package.json`、`packages/*/package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`。
- 文档：新增 `docs/package-metadata.md`；修改 `AGENTS.md`、`docs/AGENTS.md`。
- 脚本：新增 `scripts/check-manifests.mjs`。
- 不涉及：tsconfig / lint / format 配置分发、发布版本、Changesets、CI、OpenWiki、架构图 JSON。
- 风险：description 质量只能检查长度与形态；版本规则以 warning 呈现，避免被误读为发布策略。
