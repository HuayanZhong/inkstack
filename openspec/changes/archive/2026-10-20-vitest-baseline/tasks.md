# Tasks

## 1. 依赖与包配置

- [x] 1.1 在 `pnpm-workspace.yaml` 的 `dev` catalog 增加 `vitest: ^5.0.5` 与 `vite: ^8.3.4`，并在 `packages/config/package.json` 的 devDependencies 声明两者为 `catalog:dev`；验证：`pnpm install` 成功，`pnpm why vitest` 与 `pnpm why vite` 都解析到 `@inkstack/config`。
- [x] 1.2 调整 `packages/config/tsconfig.json`：`rootDir` 改为 `.`，`include: ["src", "test"]`；新增 `tsconfig.build.json` 继承它并把 `rootDir` 收回 `src`、只 include `src` 且 exclude `test`；把 `build` 与 `dev` script 改为 `tsc -p tsconfig.build.json`；验证：`pnpm --filter @inkstack/config build` 成功，`find packages/config/dist -name "*.test.*"` 无结果。
- [x] 1.3 新增 `packages/config/vitest.config.ts`，`include: ["test/**/*.test.ts"]`、`exclude: ["dist/**", "node_modules/**"]`，使用 `vitest/config` 的 `defineConfig`，并给 `packages/config` 增加 `"test": "vitest run"`；验证：`pnpm --filter @inkstack/config exec vitest run --passWithNoTests` 退出码为 0，且不扫描 `dist`。

## 2. 测试实现

- [x] 2.1 新增 `packages/config/test/env.test.ts`，覆盖 `parseEnv` 成功与多字段聚合、`EnvError.issues` 路径，以及 `envString` / `envUrlString` / `envIntString` / `envNonNegativeIntString` / `envBoolString` 的合法与非法输入；验证：`pnpm --filter @inkstack/config test` 通过，失败断言能指出字段名。
- [x] 2.2 新增 `packages/config/test/normalize.test.ts`，覆盖 `normalizePrefix` 的 `''`、`'/'`、`'api'`、`'/api/'`、`'api/'`，`normalizeBaseUrl` 的尾斜杠与空白，以及 `joinUrl` 的空侧、单斜杠与双斜杠路径；验证：`pnpm --filter @inkstack/config test` 全部通过。
- [x] 2.3 在 `turbo.json` 增加 `test` 任务（`dependsOn: ["^build"]`、`inputs: ["$TURBO_DEFAULT$"]`、`outputs: []`），在根 `package.json` 增加 `"test": "turbo run test"`；验证：`pnpm test` 成功，输出显示 `@inkstack/config` 的测试任务。

## 3. 边界与规则

- [x] 3.1 修改 `scripts/check-manifests.mjs`：根必须有 `test` script；带 `src/` 的 `packages/*` 若不在带理由的豁免表中，必须有 `test` script、`vitest: catalog:dev` 与至少一个 `test/**/*.test.ts`；当前豁免 `packages/contracts`（只导出类型）；验证：`pnpm check:manifests` 输出 0 errors，且临时移除测试文件的拷贝场景会被拒绝（只在临时目录验证，不改工作区）。
- [x] 3.2 新增 `.claude/rules/testing.md`：写明"有运行时代码的 workspace 包必须在同一变更里接入 Vitest"的边界、纯类型包豁免方式、测试文件位置与显式导入约定、禁止依赖时钟/网络的写法、新包接入步骤；验证：`pnpm format:check` 通过，规则与 `docs/testing.md` 互相链接且不复制内容。
- [x] 3.3 新增 `docs/testing.md`：命令、文件位置、最小 `vitest.config.ts` 模板、新包接入清单、当前范围、`normalizePrefix('//')` 未覆盖缺口、抽 `@inkstack/vitest-config` 的触发条件；在 `docs/AGENTS.md` 权威表增加"测试配置 → `docs/testing.md`"；验证：`pnpm format:check` 通过，两份文件链接有效。

## 4. verify 与文档回正

- [x] 4.1 在根 `package.json` 的 `verify` 中把 `pnpm test` 放在 `pnpm typecheck` 之后、`pnpm build` 之前；验证：`pnpm verify` 退出码为 0，输出包含测试执行。
- [x] 4.2 修改根 `AGENTS.md` 的阶段策略：测试按 `.claude/rules/testing.md` 执行，不再整体延后，并在工作约束中链接该规则；在 `packages/AGENTS.md` 的包边界增加测试要求；验证：用非空白字符计数确认根手写区不超过 3,200，`packages/AGENTS.md` 不超过 1,000 且不超过 25 行。
- [x] 4.3 更新 `docs/toolchain.md`（命令表加 `pnpm test`、Vitest 版本段改为当前事实、推迟项删除 Vitest / Vite 安装）、`docs/typescript.md`（删除"当前没有测试，不预建"）、`apps/bff/AGENTS.md`（从"不启用 ESLint / Prettier / Vitest"中删除 Vitest）、`docs/package-metadata.md`（检查清单增加测试边界项）；验证：`rg -n "当前没有测试|不启用.*Vitest|Vitest / Vite 安装" docs apps` 无结果。

## 5. 集成验证

- [x] 5.1 运行 `pnpm verify`、`pnpm check:manifests` 与 `pnpm --filter @inkstack/config build`，确认 `dist` 无测试文件、publint 与 knip 均通过；验证：命令退出码为 0，`find packages/config/dist -name "*.test.*"` 无结果。
- [x] 5.2 检查 `git status` 与 `git diff --stat`：改动只落在 catalog、`packages/config`、`turbo.json`、根 `package.json`、`scripts/check-manifests.mjs`、规则/文档与本次 change 目录；验证：没有应用源码或 lockfile 之外的意外改动，lockfile 仅反映新增依赖。

## Workflow follow-up

- 评审通过后归档本次 change，并同步 `repository-hygiene` 的两条要求。
- 出现第二个测试包时再抽 `@inkstack/vitest-config`；Gateway 协议测试属于 `action-protocol-and-gateway`。
