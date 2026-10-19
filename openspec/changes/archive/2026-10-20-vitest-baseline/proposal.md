# Proposal

## Why

仓库目前没有任何测试依赖、test script 或 turbo test 任务，pre-push 只覆盖静态检查。`@inkstack/config` 已经承载环境变量解析与 URL 标准化这两组纯函数，规格也定义了它们的语义，但没有可执行的验证；后续 Gateway 协议、队列与持久化都需要测试基础设施就位。测试还缺少集成文档与强制边界，只靠"以后补"会让新包继续绕过测试。

## What Changes

- 在 `dev` catalog 增加 `vitest` 与 `vite`；`vite` 是 Vitest 5 的必需 peer（非可选）。
- `packages/config` 增加 `test` script、devDependencies 与显式 `vitest.config.ts`：
  - `include` 限定 `test/**/*.test.ts`；
  - `exclude` 显式包含 `dist/**`，因为 Vitest 默认只排除 `node_modules` 与 `.git`。
- 新增 Vitest 测试覆盖 `@inkstack/config` 的纯函数：
  - `parseEnv`：成功返回、单字段失败、多字段聚合、`EnvError.issues` 路径。
  - `envString` / `envUrlString` / `envIntString` / `envNonNegativeIntString` / `envBoolString`：边界与失败语义。
  - `normalizePrefix` / `normalizeBaseUrl` / `joinUrl`：空值、斜杠与拼接规则。
- 拆分 `packages/config` 的构建配置：`tsconfig.json` 纳入测试做类型检查，新增 `tsconfig.build.json` 只 emit 非测试源码；`build` 与 `dev` 改用构建配置。
- 新增 turbo `test` 任务与根 `pnpm test` script，并把 `pnpm test` 加入 `pnpm verify`，使 pre-push 覆盖测试。
- 建立测试集成文档与强制边界：
  - 新增 `docs/testing.md`：命令、文件命名与位置、最小配置模板、新包接入步骤、当前范围与已知缺口。
  - 新增 `.claude/rules/testing.md`：有运行时代码的 workspace 包（`apps/*` 与 `packages/*`）MUST 在引入逻辑的同一个变更里提供测试；纯类型包 MUST 明确豁免并记录理由。
  - `scripts/check-manifests.mjs` 增加检查：有运行时逻辑的包必须具备 `test` script、`vitest: catalog:dev` 与至少一个 `test/**/*.test.ts`；豁免列表必须写明理由。
  - `docs/AGENTS.md` 登记测试文档的权威归属；`docs/package-metadata.md` 的检查清单同步新增项。
  - 根 `AGENTS.md` 的阶段策略从"测试完全延后"改为按测试规则执行。
  - `docs/toolchain.md`、`docs/typescript.md`、`apps/bff/AGENTS.md` 删除与现状冲突的表述。

**BREAKING**：无。不改变任何运行时行为。

## Capabilities

### New Capabilities

无。测试验证的是既有规格行为；测试边界本身属于仓库卫生。

### Modified Capabilities

- `repository-hygiene`:
  - 「推送前执行检查」从 typecheck + hygiene 扩展为完整的 `pnpm verify`（含 test）。
  - 新增「有运行时逻辑的包必须提供测试」：把测试覆盖从建议变成可检查的边界。

## Impact

- 依赖与工具：`pnpm-workspace.yaml`（`dev` catalog）、`packages/config/package.json`、`turbo.json`、根 `package.json`。
- 代码与配置：`packages/config/test/*.test.ts`、`packages/config/vitest.config.ts`、`packages/config/tsconfig.build.json`、`scripts/check-manifests.mjs`。
- 文档与规则：`docs/testing.md`（新增）、`.claude/rules/testing.md`（新增）、`docs/AGENTS.md`、`docs/package-metadata.md`、`AGENTS.md`、`docs/toolchain.md`、`docs/typescript.md`、`apps/bff/AGENTS.md`、`packages/AGENTS.md`。
- 不涉及应用代码、Gateway 协议、CI 或 Changesets。
