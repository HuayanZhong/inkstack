# Design

## Context

动机见 [proposal.md](proposal.md)。以下事实来自实际包内容与仓库核对，不依赖记忆：

- `vitest@5.0.5` 的 `engines.node` 为 `^22.12 || ^24 || >=26`；`vite` 是**非可选** peer，允许 `^6.4 || ^7 || ^8`；registry 当前 `vite@8.3.4`。
- 从 `vitest@5.0.5` tarball 的 `dist/chunks/defaults.*.js` 读取到：
  - `include` 默认 `**/*.{test,spec}.?(c|m)[jt]s?(x)`；
  - `exclude` 默认只有 `**/node_modules/**` 与 `**/.git/**`，**不包含 `dist`**；
  - `globals` 默认 `false`，`environment` 默认 `node`，`watch` 由 TTY / CI / agent 环境决定。
- 从 `dist/chunks/index.*.js` 的 `findConfigFile(root)` 读取到：配置只在执行目录查找 `vitest.config.*` 或 `vite.config.*`，**不向上搜索**。
- `vitest/config` 是正式导出子路径，`defineConfig` 从这里导入。
- `packages/config` 导出 `parseEnv`、五个 env 工厂与三个 URL 标准化函数，全部是纯函数。
- `packages/config/tsconfig.json` 设置 `rootDir: src`、`outDir: dist`，`build` 与 `dev` 直接使用它，没有 `tsconfig.build.json`。
- `scripts/check-manifests.mjs` 已对 `package.json` 做结构性校验，包含脚本、catalog、publint 与包文档三件套。
- `packages/contracts` 当前只导出类型 `ActionId`；`packages/tsconfig` 没有运行时代码。

## Goals / Non-Goals

**Goals:**

- 用最小依赖让 `pnpm test` 可运行，并接入 pre-push。
- 覆盖规格已经定义的 env 解析与 URL 标准化语义。
- 提供可复制的集成步骤，并把"有运行时逻辑就必须测试"变成清单检查而非口头约定。

**Non-Goals:**

- 不为 shell / canvas / bff / gateway 写测试。
- 不引入 React Testing Library、Playwright、coverage、UI 或 watch 模式。
- 不抽 `@inkstack/vitest-config`；当前只有一个测试包，先记录模板与触发条件。
- 不修复 `normalizePrefix` 的已知边界缺陷。
- 不改运行时行为、不接 CI、不改 Changesets。

## Decisions

### 1. 依赖进 `dev` catalog，版本允许 `^`

`pnpm-workspace.yaml` 的 `dev` catalog 增加 `vitest: ^5.0.5` 与 `vite: ^8.3.4`；`packages/config` 同时声明两者。`autoInstallPeers: false` 下 `vite` 不会自动安装，必须显式声明。

放 `dev` 而不是 `toolchain`：catalog 按用途分类，Vitest / Vite 与 turbo、knip 同属开发工具；`toolchain` 只保留需要精确 pin 的 TypeScript、openspec、oxlint / oxfmt。

### 2. 测试范围只覆盖 `packages/config`

纯函数、无 DOM、无 Nest、无外部进程，测试不需要环境或 mock；同时把 Vitest 5 + Vite 8 的组合先跑通。测试放在包级 `test/`，按 `src/` 的相对路径平级映射：

- `packages/config/src/env.ts` ↔ `packages/config/test/env.test.ts`
- `packages/config/src/normalize.ts` ↔ `packages/config/test/normalize.test.ts`

使用显式 `import { describe, expect, it } from 'vitest'`，不开启 globals。

不测试 `normalizePrefix('//')`：当前实现返回空字符串，与函数注释"保证以单个 `/` 开头"不符。测试按现状断言会把缺陷固化成契约；修复需要单独的行为变更，届时补测试。

### 3. 每个测试包必须有显式 `vitest.config.ts`

不能依赖零配置：默认 `exclude` 不含 `dist`，构建产物中的测试文件会被再次收集；配置又只在执行目录查找，不会从包目录向上找到仓库根配置。最小配置：

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
})
```

`environment` 与 `globals` 保持默认（`node` / `false`）；需要浏览器或 globals 时由具体包显式覆盖。

### 4. 拆分测试与构建 tsconfig

- `tsconfig.json` 的 `rootDir` 改为 `.`，`include: ["src", "test"]`，测试文件参与 `typecheck`。
- 新增 `tsconfig.build.json` 继承 `./tsconfig.json`，把 `rootDir` 收回 `src`，只 `include: ["src"]` 并 `exclude: ["test"]`。
- `build` 与 `dev` 改用 `tsc -p tsconfig.build.json`。

`test/` 在 `src/` 之外，保持 `rootDir: src` 会触发 `TS6059`，所以类型检查配置必须把 `rootDir` 放宽到包根，再由构建配置收回。不拆构建配置的话 `tsc` 会把测试 emit 到 `dist`，`publint` 打包时也会带上测试文件。

### 5. turbo `test` 任务与 verify 顺序

`turbo.json` 增加 `test` 任务：`dependsOn: ["^build"]`、`inputs: ["$TURBO_DEFAULT$"]`、`outputs: []`。根 `package.json` 增加 `"test": "turbo run test"`，并把 `pnpm test` 放在 `verify` 的 typecheck 之后、build 之前。测试失败比完整构建更早暴露，Turbo 会缓存依赖包构建。

不把 Vitest 直接写进根 script：包级 `test` 让后续应用按需接入，与现有 `lint` / `typecheck` 模型一致。

### 6. 边界由清单检查强制执行

`scripts/check-manifests.mjs` 增加：

- 根 `package.json` 必须有 `test` script。
- `packages/*` 中带 `src/` 的包，若不在豁免表内，必须满足：
  - `scripts.test` 存在；
  - `devDependencies.vitest === "catalog:dev"`；
  - 至少存在一个 `test/**/*.test.ts`（递归查找）。
- 豁免表是带理由的显式映射，当前只有 `packages/contracts`（只导出类型）；`packages/tsconfig` 没有 `src/`，自然不进入检查。

选择"默认必须、豁免显式"而不是"检测导出有没有运行时值"：静态判断导出是否为纯类型不可靠，显式豁免更容易审查，漏列会直接失败而不是静默放过。

规则文本覆盖所有 workspace 包：`apps/*` 与 `packages/*` 一旦引入可测逻辑，必须在同一个变更里补测试。清单检查先强制 `packages/*`；`apps/*` 的 scripts 与运行形态差异较大，暂不做静态强制，由规则与评审约束。

规则文本写入 `.claude/rules/testing.md`，操作步骤写入 `docs/testing.md`；两者分工是规范与指南，不互相复制。

### 7. 文档与规则的具体落点

- `docs/testing.md`：命令、文件命名与位置、最小配置模板、新包接入清单（依赖、script、config、tsconfig 拆分、测试文件）、当前范围、未覆盖的 `normalizePrefix('//')` 缺口、抽 `@inkstack/vitest-config` 的触发条件（出现第二个测试包）。
- `.claude/rules/testing.md`：边界（哪些包必须、如何豁免）、写法（按 `src/` 平级映射到 `test/`、显式导入、禁止依赖时钟/网络）、接入步骤链接。
- `docs/AGENTS.md`：权威表增加"测试配置 → `docs/testing.md`"。
- `docs/package-metadata.md`：检查清单增加测试边界项。
- `packages/AGENTS.md`：包边界增加测试要求并链接规则。
- 根 `AGENTS.md`：阶段策略改为按测试规则执行，并在工作约束中链接 `.claude/rules/testing.md`；实施时按非空白字符计数，确保手写区不超过 3,200。
- `docs/toolchain.md`：命令表增加 `pnpm test`，Vitest 版本段改为当前事实，推迟项删除 Vitest / Vite 安装。
- `docs/typescript.md`：删除"当前没有测试，不预建"，改为已生效的拆分规则。
- `apps/bff/AGENTS.md`：从"不启用 ESLint / Prettier / Vitest"中删除 Vitest。

## Risks / Trade-offs

- **`autoInstallPeers: false` 下 Vite 解析失败** → 在 `packages/config` 显式声明 `vite: catalog:dev`，用 `pnpm why vite` 与 `vitest run` 验证。
- **默认 exclude 不含 `dist`** → 每个测试包都写显式 `vitest.config.ts`，并在模板中固定 `dist/**`。
- **配置不会向上查找** → 新包接入清单要求包内配置，不从仓库根继承。
- **豁免表可能被滥用** → 只有纯类型包可加入，必须写理由；运行时代码包加入豁免会在评审中暴露。
- **构建配置拆分改变 `dist` 内容** → 构建后确认 `dist` 无 `*.test.*`，再跑 `pnpm hygiene` 与 publint。
- **`normalizePrefix` 已知边界未覆盖** → 在 `docs/testing.md` 记录为已知缺口，修复时补测试。
- **根 `AGENTS.md` 预算紧张** → 实施时按非空白字符计数，替换与新增内容不得让手写区超过 3,200。

## Migration Plan

1. 先加 catalog 与 `packages/config` 依赖，运行 `pnpm install`，确认 `pnpm why vite` / `pnpm why vitest` 解析到该包。
2. 拆 `tsconfig.build.json` 与 `vitest.config.ts`，再写测试文件，运行 `pnpm --filter @inkstack/config test`。
3. 加 turbo 任务、根 script 与 `verify` 步骤，运行完整 `pnpm verify`。
4. 修改 `check-manifests` 与测试规则/文档，运行 `pnpm check:manifests` 与 `pnpm verify`。
5. 回滚：删除测试、配置与检查项，恢复 `verify` / turbo / catalog，不涉及数据或运行时状态。

## Open Questions

无。
