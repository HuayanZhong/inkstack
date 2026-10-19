# Design

## Context

动机见 [proposal.md](proposal.md)。核对到的现状：

- `apps/shell/env.ts` 用 `envUrlString()` 声明 `NEXT_PUBLIC_CANVAS_MF_ENTRY`，没有默认值；`next.config.ts` 导入该模块，缺失时 dev / build 直接失败。客户端 [canvas-host.tsx](../../../apps/shell/src/app/canvas-host.tsx) 直接读取该变量，缺失时进入错误状态。
- `apps/canvas/rspack.config.ts` 的 dev publicPath 是 `` `http://${env.CANVAS_HOST}:${env.CANVAS_PORT}/` ``，production 为 `auto`；`CANVAS_HOST` 默认 `localhost`，`CANVAS_PORT` 默认 `4002`。
- 四个应用的 env schema 分别位于 `apps/shell/env.ts`、`apps/canvas/src/config/env.ts`、`apps/bff/src/config/env.ts`、`apps/gateway/src/config/env.ts`；`environment-configuration` 目前只描述 BFF。
- `pnpm view vitest version peerDependencies`（2026-10-19）：`5.0.5`，peer 为 `vite ^6.4.0 || ^7.0.0 || ^8.0.0`；registry 的 `vite` 当前为 `8.3.4`。
- `knip.config.ts` 当前只 ignore `.agents/**` 与 `@fission-ai/openspec`，不再有 `.claude/**` 和 packages 的 `src/index.ts` entry。
- `pnpm-workspace.yaml` 同时有 `autoInstallPeers: false` 与 `peerDependencyRules.ignoreMissing: [eslint]`。
- `apps/gateway/AGENTS.md` 一面写 Gateway 负责持久化，一面写"不直接写 design.json"；`AGENTS.md` 与 `DESIGN-RECORD.md` 均把持久化归给 Gateway。

## Goals / Non-Goals

**Goals:**

- 让三份受影响规格与当前代码行为一致，且每条要求可测试。
- 让 `docs/toolchain.md`、`docs/package-metadata.md`、`DESIGN-RECORD.md` 只描述已存在的配置。
- 用同一种表述描述 Gateway 的持久化归属，消除 `apps/gateway/AGENTS.md` 的内部矛盾。

**Non-Goals:**

- 不修改任何运行时代码、构建配置或依赖。
- 不定义 Gateway 持久化协议、存储格式或写入时机；这些属于后续 `action-protocol-and-gateway`。
- 不改 `docs/architecture/source/*.json` 与生成图；现有 SQLite / MikroORM 描述与选型一致。
- 不接入测试、CI 或 Changesets。

## Decisions

### 1. 以代码为准修规格，不为规格回退代码

`NEXT_PUBLIC_CANVAS_MF_ENTRY` 保持必填：

- `.claude/rules/env.md` 明确要求跨应用地址显式配置，不从另一个应用的端口推导。
- 必填让缺失在 dev / build 阶段暴露，而不是把 localhost 带回生产构建。
- 客户端仍保留缺失时的错误状态，用于清单缓存等异常场景，不作为配置回退。

替代方案是给 `envUrlString()` 加 `.default('http://localhost:4002/mf-manifest.json')`。不采用：这与 env 规则冲突，也会让生产构建在漏配时静默指向 localhost。

### 2. canvas 的 dev 地址以 `CANVAS_HOST` / `CANVAS_PORT` 为准

规格改为描述变量组合与默认值，不再固定 `localhost`。理由是代码已支持局域网与多设备调试，固定值会让规格与实现长期分叉。production 继续使用 `auto`，规格保留"清单不得包含 localhost"的可验证约束。

### 3. `environment-configuration` 扩展为跨应用契约

- 修改「环境校验在启动前完成」：适用对象改为 shell / canvas / bff / gateway，并把"启动"限定为开始监听端口或产出构建。
- 删除 BFF 专属的端口要求，新增「监听端口由应用专属变量决定」，一次覆盖四个应用、默认值与正整数约束。替代方案是保留 BFF 要求再追加三条应用要求；不采用，因为四条几乎相同的要求会分散同一契约。
- 修改「业务代码通过类型化配置读取」：服务端统一读配置对象；客户端读取 `NEXT_PUBLIC_*` 允许直接引用完整变量名，因为 Next 只对构建期字面引用做内联，服务端配置模块无法在客户端复用。该例外限定为公开前缀，服务端密钥仍禁止进入客户端。
- 「解析器语义固定」不改，`packages/config/src/env.ts` 与描述一致。

### 4. Gateway 持久化只统一措辞，不新增规格

架构不变量保持不变：Gateway 是唯一序列器，负责 action 排队、编号、校验、广播与持久化；canvas 只执行并 ack。`apps/gateway/AGENTS.md` 的"不直接写 design.json"改为"持久化由 Gateway 的持久化模块完成，canvas 不写文件"。

不新增 Gateway 规格：当前没有实现，提前写要求会与 `action-protocol-and-gateway` 的范围重叠。`apps/gateway/README.md` 已说明持久化尚未接入，继续保持"架构归属"与"当前状态"分离。

### 5. 文档回正按已验证事实逐条改

| 文件                                 | 修改                                                                                                                                                                                                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/toolchain.md`                  | Vitest 4 → Vitest 5（peer `vite ^6.4 \|\| ^7 \|\| ^8`，接入时固定 Vite 8.x）；删除 knip 的 `.claude/**` 与 packages `src/index.ts` entry 描述；eslint 机制改为 `autoInstallPeers: false` + `ignoreMissing` 仅抑制警告；推迟项删除已安装的 Nest / Next / React / tldraw |
| `docs/package-metadata.md`           | 非目标中的 "CI / pre-commit 接入" 改为 "CI 接入与 OpenWiki"，因为 pre-commit 已由 husky 启用                                                                                                                                                                           |
| `docs/architecture/DESIGN-RECORD.md` | 里程碑说明改为 lint 已接入，测试、Changesets、CI 仍延后                                                                                                                                                                                                                |
| `apps/gateway/AGENTS.md`             | 统一持久化归属表述                                                                                                                                                                                                                                                     |

版本事实以 `pnpm view` 与已安装包为准，不照抄旧文档；Vitest 尚未安装，因此只改文档，不写入 catalog。

## Risks / Trade-offs

- **规格 delta 只有归档时才会写入主规格** → 实施完成后必须执行 `/opsx:archive` 并选择 sync；否则主规格仍是旧版本。
- **Gateway 措辞可能被读成"已实现"** → 保留包 README 的"尚未接入"，AGENTS 只描述职责归属，不描述进度。
- **文档漂移没有自动门禁** → 本次只靠人工核对；CI 接入后再考虑文档链接与版本断言，本次不新增检查。
- **Vite / Vitest 版本会继续前进** → 文档记录方法与当前事实，不把具体小版本写死为长期承诺；接入时重新查 registry。
- **扩展 `environment-configuration` 会改变主规格的需求集合** → 归档同步后确认 BFF 端口要求已删除、新端口要求已出现，避免残留重复要求。

## Migration Plan

1. 先改 `openspec/specs` 对应 delta 与四份文档，不改代码。
2. 运行 `openspec validate spec-docs-reconciliation --strict` 与 `pnpm format:check`。
3. 运行 `pnpm verify` 确认文档改动没有破坏仓库检查。
4. 归档并按 sync 流程写入主规格；回滚只需还原本次修改的文件。
