# Tasks

## 1. 文档回正

- [x] 1.1 更新 `docs/toolchain.md`：Vitest 4 改为 Vitest 5 并注明 peer `vite ^6.4 || ^7 || ^8`；删除 knip 对 `.claude/**` 与 packages `src/index.ts` entry 的描述；eslint 机制改为 `autoInstallPeers: false` + `ignoreMissing` 只抑制警告；推迟项删除已安装的 Nest / Next / React / tldraw；验证：`rg -n "Vitest 4|\\.claude/\\*\\* 是 vendored|packages/config.*src/index.ts|Nest / Next / React / tldraw" docs/toolchain.md` 无结果，且 `rg -n "autoInstallPeers|Vitest 5" docs/toolchain.md` 有输出。
- [x] 1.2 更新 `docs/package-metadata.md` 的非目标：删除 "pre-commit 接入"，保留 CI 与 OpenWiki；验证：`rg -n "CI / pre-commit|pre-commit" docs/package-metadata.md` 无结果。
- [x] 1.3 更新 `docs/architecture/DESIGN-RECORD.md` 的里程碑说明：lint 已接入，测试 / Changesets / CI 仍延后；验证：`rg -n "lint.*延后|骨架期 lint" docs/architecture/DESIGN-RECORD.md` 无结果，且该句明确写出 lint 已接入。
- [x] 1.4 更新 `apps/gateway/AGENTS.md` 的持久化表述：Gateway 负责 action log 与 `design.json` 快照持久化，canvas 只执行并 ack、不写文件；验证：该文件不再出现"不直接写 design.json"，且与根 `AGENTS.md` 的序列器表述一致。

## 2. 规格一致性

- [x] 2.1 逐条核对三个 delta 与代码：`apps/shell/env.ts` 的必填变量、`apps/canvas/rspack.config.ts` 的 publicPath、四个应用的入口端口变量与默认值；验证：delta 中的变量名、默认值与失败行为都能在对应文件中找到，必要时修正 delta。
- [x] 2.2 运行 `openspec validate spec-docs-reconciliation --strict`；验证：退出码为 0，没有 requirement 描述超长或缺少 scenario 的警告。

## 3. 集成验证

- [x] 3.1 运行 `pnpm verify`；验证：退出码为 0，`format:check` 通过（Markdown 改动已格式化）。
- [x] 3.2 检查 `git status` 与 `git diff --stat`：改动只落在本次 change 目录、`docs/toolchain.md`、`docs/package-metadata.md`、`docs/architecture/DESIGN-RECORD.md`、`apps/gateway/AGENTS.md`；验证：没有代码、依赖或 lockfile 改动。

## Workflow follow-up

- 评审通过后归档本次 change，并在归档时同步 delta 到主规格。
- 归档后确认 `environment-configuration` 中 BFF 专属端口要求已删除、新的跨应用端口要求已出现。
- 后续按计划处理 `action-protocol-and-gateway`；Vitest 接入与共享包抽离各自另起变更。
