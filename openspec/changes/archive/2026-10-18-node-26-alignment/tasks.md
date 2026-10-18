# Tasks

## 1. 版本声明对齐

- [x] 1.1 将 `.nvmrc` 改为 `26.12.0`，根 `package.json` 的 `engines.node` 改为 `>=26.12.0`，`pnpm-workspace.yaml` 的 `dev` catalog 中 `@types/node` 改为 `^26.6.5`；运行 `pnpm install`，确认退出码为 0、`node -e` 读到三处声明一致，并用 `pnpm list @types/node -r --depth 0` 确认解析到 26.x。
- [x] 1.2 更新文档中的旧版本声明：`AGENTS.md` 的 Node 版本、`README.md` 的开发要求、`docs/toolchain.md` 推迟项中删除「Node 升级到 24.15+」；运行 `grep` 确认除 `openspec/changes/archive/` 与 `pnpm-lock.yaml` 外没有 `24.14.1` / `24.15` 残留，并复查根 `AGENTS.md` 预算（≤70 行、≤3,200 非空白字符，排除工具标记块）。

## 2. 安装与仓库脚本

- [x] 2.1 在现有 `node_modules` 上运行 `pnpm install`，确认 `engine-strict` 没有拒绝任何包；检查 `git diff --stat pnpm-lock.yaml`，确认变化只涉及 `@types/node` 及其依赖方，没有意外的依赖升级。
- [x] 2.2 运行 `pnpm format` 与 `pnpm format:check`，确认退出码为 0 且格式化没有产生额外 diff；运行 `pnpm lint`，确认包级 lint 与 Turbo 环境变量检查都通过。
- [x] 2.3 运行 `pnpm typecheck` 与 `pnpm build`，确认两者退出码为 0；确认 `packages/contracts/dist/index.js` 仍是 ESM（包含 `export`，没有 `require(`）。
- [x] 2.4 运行 `pnpm check:manifests`，确认 7 个 manifest 全部通过，`.nvmrc` 与 `engines.node` 的等值检查没有报错。

## 3. Hooks 与工具链

- [x] 3.1 运行 `sh .husky/pre-commit`（索引为空）与 `sh .husky/pre-push`，确认两者退出码为 0；确认 `pre-commit` 输出 `lint-staged could not find any staged files`，`pre-push` 实际执行了 `turbo run typecheck`。
- [x] 3.2 运行 `pnpm exec turbo --version` 与 `pnpm exec turbo docs "caching"`，确认版本为 2.11.9 且检索返回 `v2-11-9.turborepo.dev` 链接；记录 `AGENTS.md` 哈希后运行 `CLAUDE_CODE=1 pnpm exec turbo run typecheck --dry=json`，确认退出码为 0 且哈希不变（托管块未被重写）。

## 4. 全局工具与回退信息

- [x] 4.1 依次运行 `claude --version`、`codex --version`、`opencode --version`、`openwiki --version`、`uipro --help`、`nest --version`、`openspec --version`、`yarn --version`，确认全部可执行；记录 `nest` 与 `openspec` 的版本，确认 pnpm 全局目录在 Node 26 下仍可用。
- [x] 4.2 运行 `nvm list` 确认 24.14.1 仍保留；确认 `C:\Users\Administrator\.claude\projects\` 与项目的 JSONL 记录仍存在；在变更说明中记录回退到 24.22.0 LTS 时需要改的三处文件（`.nvmrc`、`engines`、`@types/node`）。

## 5. 集成验证

- [x] 5.1 按顺序运行 `pnpm install`、`pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm check:manifests`，确认全部退出码为 0。
- [x] 5.2 运行 `git status --short` 与 `git diff --stat`，确认改动只包含 `.nvmrc`、`package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`AGENTS.md`、`README.md`、`docs/toolchain.md`、`scripts/check-manifests.mjs`；没有临时文件、没有构建产物被跟踪。

## Workflow follow-up

- 变更实现并验证完成后，按项目流程运行 `/opsx:archive`。
- 提交由用户执行；不代用户 staging 或 commit。
- 24.14.1 的卸载留到 Node 26 验证稳定之后，由用户自行决定。
