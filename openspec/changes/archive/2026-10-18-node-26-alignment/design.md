# Design

## Context

- 机器当前：Node `26.12.0`（nvm 中 24.14.1 仍保留）、npm `11.20.0`、pnpm `12.14.0`。
- 全局 npm 包已重装并在新 Node 下可用：claude-code 2.1.302、codex 0.163.0、opencode-ai 1.19.3、openwiki 0.7.2、pino-pretty 13.2.0、pnpm 12.14.0、uipro-cli 2.2.3、yarn 1.22.22。
- pnpm 全局目录 `%LOCALAPPDATA%\pnpm\global\v11` 仍包含 openspec 1.14.3、`@nestjs/cli` 12.0.0、pnpm 12.14.0；shim 通过 PATH 查找 `node`。
- 仓库声明：`.nvmrc` 与 `engines.node` 都是 `24.14.1`；`@types/node` 为 `^24.19.2`；`.npmrc` 开启 `engine-strict=true`。
- 仓库内原生绑定只有 `@oxfmt/binding-win32-x64-msvc` 与 `@oxlint/binding-win32-x64-msvc`，均为 N-API 二进制。
- husky 的 `pre-commit`（lint-staged）与 `pre-push`（`pnpm typecheck`）刚接入；Turborepo 已开启 `agentGuidance`。

## Goals / Non-Goals

**Goals:**

- 让 `.nvmrc`、`engines`、`@types/node` 与运行时完全一致。
- 用仓库现有脚本验证 Node 26 下的安装、格式化、lint、类型检查、构建与 manifest 约束。
- 验证 husky、Turborepo、oxc 原生绑定与全局 CLI 在新运行时下可执行。
- 保留可回退信息，不提前销毁旧版本。

**Non-Goals:**

- 不卸载 Node 24.14.1。
- 不改变全局工具的版本选择策略，不把全局工具纳入仓库。
- 不接入应用骨架、Vitest、CI。
- 不为了通过检查而放宽 lint / tsconfig / manifest 规则。

## Decisions

### 1. 版本基线采用 26.12.0，而不是 24.22.0 LTS

- 运行时已经是 26.12.0，且关键依赖接受 `>=26`：`@nestjs/schematics`、`jsdom` 为 `>=26.0.0`，Next / Vite / tldraw 的下界远低于 26。
- 替代方案：退回 24.22.0 LTS。保留为回退路径：只有出现无法绕过的原生绑定或工具不兼容时才采用。
- 不删除 24.14.1，直到 26.12.0 的完整验证通过。

### 2. `.nvmrc` 与 `engines` 继续相等

- 两者都写 `26.12.0` / `>=26.12.0`，`check-manifests` 的等值检查保持不变。
- 替代方案：`.nvmrc` 用最新版、`engines` 用宽松下界，并把检查改成「`.nvmrc` 不低于下界」。拒绝原因：当前只有一个开发者、一个运行时，先保持最严格的等式；等多环境需求出现再放宽。

### 3. `@types/node` 跟随 Node 主版本

- 从 `^24.19.2` 升到 `^26.6.5`，与仓库既有规则「`@types/node` 主版本跟随 Node 主版本」一致。
- 替代方案：保留 24.x。拒绝原因：类型定义会缺少 Node 26 的 API，且与 `engines` 声明矛盾。

### 4. 先验证，不预先清理

- 先在现有 `node_modules` 上运行 `pnpm install` 与全套脚本。
- 只有出现与 Node ABI 或安装状态相关的失败时，才按顺序尝试 `pnpm install --force`、删除 `node_modules` 后重装。
- 不预先删除 `.turbo` 或 `dist`：它们的缓存键不包含 Node 版本，且当前产物是普通 JS。

### 5. 验证矩阵按「声明 → 安装 → 仓库脚本 → hooks → 工具 → 全局」排列

```
node/pnpm/npm 版本
  -> .nvmrc / engines / @types/node / lockfile 一致
  -> pnpm install（engine-strict）
  -> format / lint / typecheck / build / check:manifests
  -> husky pre-commit / pre-push
  -> turbo / oxfmt / oxlint 原生绑定
  -> 全局 CLI：claude / codex / opencode / openwiki / uipro / nest / openspec / yarn
  -> git status 范围检查
```

- hook 验证只运行空索引的 `pre-commit` 与 `pre-push`，不重复用 `git add` 制造探针；自动回写暂存区的行为已在 `husky-hooks` 变更中验证，且与 Node 版本无关。

### 6. 全局 CLI 只验证可执行，不升级、不写回仓库

- `nest --version` 同时验证 pnpm 全局目录在 Node 26 下仍可运行。
- `openspec --version` 验证工具链与项目 devDependency 都是 1.14.3。
- 全局工具的版本不写入仓库文档，避免形成第二个版本 home。

## Risks / Trade-offs

- [Node 26 是 Current，个别工具可能尚未覆盖] → 验证矩阵负责暴露；回退到 24.22.0 LTS，只改 `.nvmrc` / `engines` / `@types/node` 三处。
- [`engine-strict` 下某个依赖声明了不包含 26 的 engines] → 记录包名与范围，优先升级依赖；不放宽 `engine-strict`。
- [旧 pnpm 全局 shim 依赖旧 Node 路径] → `nest --version`、`openspec --version` 验证；失效则用 `pnpm add -g` 重装这三个包。
- [@types/node 26 引入新的类型错误] → 只做类型层修正；若需要改运行时行为，暂停并单独评估。
- [预装依赖与 Node 26 的 ABI 不匹配] → oxc 绑定是 N-API；失败时 `pnpm rebuild` 或干净重装，而不是降级 Node。
- [升级后 Claude Code 历史丢失的误解] → 历史在 `~/.claude`，与 Node 安装目录无关；验证任务只检查路径存在，不移动数据。
