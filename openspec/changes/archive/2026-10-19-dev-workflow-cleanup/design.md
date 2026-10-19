# Design

## Context

动机见 [proposal.md](proposal.md)。影响设计的现状：

- 根 `package.json` 有 `start: turbo run start`；`turbo.json` 有 `start` 任务；shell / BFF / Gateway 各有 `start`，canvas 没有。
- `turbo.json` 的 `start` 只有 `dependsOn: ["^build"]`，不会构建应用自身；shell 的 `next start` 依赖已经存在的 `.next`。
- BFF / Gateway 的 `start` 使用 `nest start`，而 `@nestjs/cli` 在 devDependencies。
- `.husky/pre-push` 只跑 `pnpm typecheck` 与 `pnpm hygiene`；`.oxlintrc.staged.json` 关闭了 `typeAware`。
- `pnpm why eslint` 显示 `eslint@10.13.0` 被 `eslint-plugin-turbo` 的 peer 自动安装；`peerDependencyRules.ignoreMissing` 不会阻止 auto-install。
- `turbo.json` 的 `typecheck` 没有 `inputs`，但 shell 的 typecheck 会加载 env 并执行 `next typegen`。
- `packages/contracts` 的 scripts 调用 `tsc`，但没有声明 `typescript`；`packages/config` 有。
- `knip` 当前输出 5 条配置提示：`.claude/**` ignore，以及 `packages/config`、`packages/contracts`、`apps/canvas` 的冗余 entry。
- `socket.io-client` 在 `runtime` catalog，但当前只被 Gateway 的 smoke 脚本使用。

## Goals / Non-Goals

**Goals:**

- 本地启动只有一个入口：根 `pnpm dev`。
- 让 pre-push 真正覆盖 lint、manifest、typecheck、应用构建、格式与 hygiene。
- 去掉 eslint 的隐式安装，保持依赖来源可解释。
- 清理与工作流相关的配置漂移，不触碰应用运行时代码。

**Non-Goals:**

- 不设计生产启动；`node dist/main.js` / `next start` 留到真实部署时。
- 不接 CI、Changesets、Vitest。
- 不做 host / CORS / 鉴权 / env 边界等批次 2 改造。
- 不做文档与规格回正（另起 `spec-docs-reconciliation`）。
- 不抽公共包，不改 action 协议。

## Decisions

### 1. 删除 `start`，统一到 `dev`

删除：

- 根 `package.json` 的 `"start": "turbo run start"`。
- `turbo.json` 的 `start` 任务。
- `apps/shell/package.json`、`apps/bff/package.json`、`apps/gateway/package.json` 的 `start` scripts。
- canvas 本来没有 `start`，不动。

各应用保留：

```text
dev / build / lint / typecheck
```

Gateway 额外保留 `smoke:ws`。

理由：

- 当前没有真正的生产启动设计；保留 `start` 只会把 `nest start` 依赖 devDependency、`turbo start` 不构建应用、canvas 被跳过这三个问题留在仓库里。
- `pnpm dev` 已经覆盖本地开发；`pnpm build` 负责构建验证。
- 以后需要生产启动时，按部署形态单独设计，不在骨架阶段猜。

替代方案是保留 `start` 并给 `turbo.json` 加 `"dependsOn": ["build", "^build"]`，同时把 Nest 改成 `node dist/main.js`。本次不选，因为用户明确要保留 dev 模式、统一脚本。

**迁移**：`pnpm start` 不再可用；本地改用 `pnpm dev`。这是本次唯一的用户可见脚本破坏。

### 2. 新增 `verify` 并让 pre-push 执行

根 `package.json` 增加：

```json
"verify": "pnpm install --frozen-lockfile && pnpm lint && pnpm check:manifests && pnpm typecheck && pnpm build && pnpm format:check && pnpm hygiene"
```

`.husky/pre-push` 改为：

```sh
pnpm verify
```

顺序理由：

1. `install --frozen-lockfile`：先确认 lockfile 与 package.json 一致，避免依赖声明漂移。
2. `lint`：执行 type-aware lint 与 `turbo/no-undeclared-env-vars`，补上 staged lint 关闭的部分。
3. `check:manifests`：校验 catalog、包元数据、tsconfig、publint 声明。
4. `typecheck`：类型检查。
5. `build`：构建所有应用，覆盖 shell / canvas 的 bundler 错误。
6. `format:check`：确认格式。
7. `hygiene`：knip + 库包 publint。

`build` 与 `hygiene` 内部都会构建 package；Turbo 缓存会让重复部分接近零成本。

替代方案是只把 `lint` 加进现有 pre-push。本次选择完整 `verify`，因为 CI 尚未接入，hooks 是唯一远端门禁。

### 3. `autoInstallPeers: false`，移除隐式 eslint

在 `pnpm-workspace.yaml` 顶层增加：

```yaml
autoInstallPeers: false
```

理由：

- `eslint-plugin-turbo` 的 peer 让 pnpm 自动安装 `eslint@10.13.0`，但项目 lint 使用 oxlint。
- `peerDependencyRules.ignoreMissing` 只压制警告，不阻止安装。
- 关掉 auto-install peers 后，`pnpm why eslint` 应为空；`pnpm lint` 应仍能通过，因为 oxlint 提供 ESLint v9 兼容接口。

验证顺序：

```bash
pnpm install
pnpm why eslint
pnpm lint
```

如果 `pnpm lint` 因缺少 eslint 失败，则把 `eslint` 显式加入 `dev` catalog 和根 `devDependencies`，并在 `pnpm-workspace.yaml` 注释说明原因；不再保留“隐式安装”的状态。

已有 lockfile 会保留之前解析出的 eslint；实施时以重新生成的 lockfile 为准，否则 `pnpm why eslint` 仍会命中旧条目。重新生成会解析到 catalog 允许的最新 minor（本次为 `@commitlint/cli` / `@commitlint/config-conventional` 21.2.4、`knip` 6.42.0），这是可接受副作用。

### 4. `typecheck` 缓存包含 env

`turbo.json`：

```json
"typecheck": {
  "description": "按包执行 TypeScript 类型检查；先构建依赖包，不产出文件。",
  "dependsOn": ["^build"],
  "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/.env*"]
}
```

理由：shell 的 typecheck 通过 dotenv 加载 env 并执行 `next typegen`；env 文件不在默认输入里，修改后可能命中旧缓存。

### 5. 补齐 package 依赖与 catalog 分类

- `packages/contracts/package.json` 的 `devDependencies` 增加 `"typescript": "catalog:toolchain"`，与 `packages/config` 一致。
- `pnpm-workspace.yaml` 把 `socket.io-client` 从 `runtime` 移到 `dev`；`apps/gateway/package.json` 的 devDependency 改为 `catalog:dev`。后续 canvas 真正使用时再移回 `runtime`。

### 6. 清理 knip 提示

删除以下冗余 pattern：

- `packages/config` 的 `entry: ['src/index.ts']`
- `packages/contracts` 的 `entry: ['src/index.ts']`
- `apps/canvas` 的 `rspack.config.ts` 与 `src/index.ts`
- 根 workspace `ignore` 中的 `.claude/**`

保留：

- 根 `entry: ['scripts/**/*.mjs']`
- `apps/gateway` 的 `entry: ['src/main.ts', 'scripts/**/*.mjs']`
- `apps/canvas` 的 `module-federation.config.ts` entry
- `.agents/**` ignore，并补一条中文理由：vendored 技能不属于仓库源码。

先不把 `--treat-config-hints-as-errors` 加进 hygiene；清理稳定后再考虑升级为错误。

### 7. 文档同步

删除 `start` 后需要同步：

- `docs/toolchain.md:65`：依赖构建列表去掉 `start`。
- `docs/toolchain.md:66`：env 链只保留 dev / build。
- `docs/toolchain.md:88`：pre-push 改为 `pnpm verify`。
- `docs/toolchain.md` 的命令表增加 `pnpm verify`。
- `.env.example:5-8`：加载机制只保留 dev / build。
- `apps/gateway/README.md` 的 WS smoke 说明从“先启动 `dev` 或 `start`”改为只写 `dev`。

根 README 与 AGENTS 当前没有 `start` 命令，不需要改；如果实现时发现遗漏，一并同步。

## Risks / Trade-offs

- **`verify` 变慢** → Turbo 缓存会摊平重复构建；如果本地反馈仍然太慢，再拆 `verify:fast`（lint + typecheck）与 `verify`，但 pre-push 保持完整版。
- **`autoInstallPeers: false` 可能暴露其他缺失 peer** → 先跑 `pnpm install` 与 `pnpm lint`；只对实际报错做显式依赖，不重新打开 auto-install。
- **oxlint 的 eslint 兼容层不完整** → 如果 `pnpm lint` 失败，按第 3 条 fallback 显式安装 eslint；这是可回滚的单点改动。
- **删除 `start` 让旧文档或本地脚本失效** → 用 `rg` 检查 `start` 引用；本次列出的文档必须同步，根 README 与 AGENTS 复查。
- **`pnpm install --frozen-lockfile` 在 pre-push 失败** → 这是预期行为：package.json 变更必须同时更新 lockfile。
- **knip 删除 entry 后误报** → 以 `pnpm hygiene` 输出为准；只删除提示明确标记为 redundant 的 pattern，保留 gateway 与 MF 配置 entry。
- **`socket.io-client` 移到 dev 后生产安装不可用** → 当前只有 smoke 使用，生产不需要；canvas 接入时再移到 runtime。
- **重新生成 lockfile 会升级允许范围内的 minor** → 本次接受 commitlint 21.2.4 与 knip 6.42.0；如果要求严格不动，改为精确 pin 或单独升级提交。

## Migration Plan

1. 先删除 `start` 与 turbo 任务，更新文档，跑 `pnpm install` 与 `pnpm typecheck` 确认无脚本引用错误。
2. 再调整 `autoInstallPeers` 与 catalog / 依赖，跑 `pnpm install`、`pnpm why eslint`、`pnpm lint`。
3. 最后加 `verify` 与 pre-push，跑一次完整 `pnpm verify`。
4. 回滚：恢复 `start` scripts / turbo 任务、移除 `autoInstallPeers`、恢复 `verify` 之前的 pre-push；不涉及数据或运行时状态。

## Open Questions

无。生产启动、CI、运行时安全与文档/规格回正都明确留到后续变更。
