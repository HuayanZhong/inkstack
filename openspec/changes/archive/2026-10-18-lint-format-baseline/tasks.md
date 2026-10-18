# Tasks

## 1. 工具链依赖

- [x] 1.1 在 `pnpm-workspace.yaml` 的 `toolchain` catalog 中加入 `oxfmt: 0.73.0`、`oxlint: 1.88.0`、`oxlint-tsgolint: 7.0.2004`，并在根 `package.json` 的 `devDependencies` 中以 `catalog:toolchain` 引用；运行 `pnpm install`，确认 `engine-strict=true` 下安装成功且 `pnpm exec oxlint --version` 输出 1.88.0。
- [x] 1.2 在 `dev` catalog 中加入 `eslint-plugin-turbo: ^2.11.9`，并在 `pnpm-workspace.yaml` 增加 `peerDependencyRules.ignoreMissing: [eslint]`；运行 `pnpm install` 与 `pnpm why eslint-plugin-turbo`，确认插件已安装且没有因缺少 `eslint` 失败。

## 2. format 基线

- [x] 2.1 创建 `.oxfmtrc.json`，设置 `printWidth: 100`、`tabWidth: 2`、`useTabs: false`、`semi: false`、`singleQuote: true`、`trailingComma: "all"`、`arrowParens: "always"`、`bracketSpacing: true`、`endOfLine: "lf"`，并忽略 `node_modules`、`dist`、`.next`、`coverage`；运行 `pnpm exec oxfmt --check "packages/contracts/src/index.ts"`，确认配置可被加载（格式差异可暂时报错）。
- [x] 2.2 在根 `package.json` 增加 `format: "oxfmt --write ."` 与 `format:check: "oxfmt --check ."`；运行 `pnpm format`，确认 oxfmt 完成全仓库格式化（用户已确认全量覆盖可接受），并运行 `pnpm format:check` 确认退出码为 0。
- [x] 2.3 确认格式化只改变文件内容格式，不改变依赖与脚本语义：检查 `git diff -- package.json pnpm-workspace.yaml pnpm-lock.yaml`，语义改动仅包含本次新增的依赖、`peerDependencyRules` 与 format 相关 scripts。

## 3. lint 基线

- [x] 3.1 创建 `.oxlintrc.json`，包含 `options.typeAware: true`、`reportUnusedDisableDirectives: "warn"`、`ignorePatterns`，以及共享规则 `no-var`、`prefer-const`、`no-unused-vars`（忽略 `^_`）、`typescript/no-floating-promises`、`typescript/no-misused-promises`、`typescript/no-explicit-any`、`typescript/consistent-type-imports`；运行 `pnpm exec oxlint --config .oxlintrc.json --type-aware packages/contracts`，确认配置可加载、没有未知规则错误，现有问题已修复或按注释规范压制。
- [x] 3.2 在 `packages/contracts/package.json` 增加 `lint: "oxlint --config ../../.oxlintrc.json --type-aware ."`；运行 `pnpm lint`，确认 turbo 执行到 contracts 的 lint 且退出码为 0；若 tsgolint 从包目录无法定位 tsconfig，记录实际错误并停止，不改用路径兼容层。
- [x] 3.3 在 `.oxlintrc.json` 增加平面 override：`apps/{shell,canvas}/**` 启用 `react`、`jsx-a11y` 与 browser 环境；`apps/{gateway,bff}/**` 与未来的 `packages/ai-*/**` 使用 node 环境；`apps/gateway/**` 关闭 `typescript/no-extraneous-class`、`no-useless-constructor`、`typescript/consistent-type-imports`；再次运行 `pnpm lint`，确认配置接受所有规则名且现有代码仍通过。
- [x] 3.4 创建只含 `jsPlugins: ["eslint-plugin-turbo"]` 与 `turbo/no-undeclared-env-vars: "error"` 的 `.oxlintrc.turbo.json`（不 extends 主配置，避免重复执行代码规则），在根 `package.json` 增加 `lint:env` 与串联后的 `lint`；创建临时文件写入 `process.env.INKSTACK_TEST_TOKEN`，运行 `pnpm lint:env` 确认报错，再在 `turbo.json` 的 `globalEnv` 临时加入该变量确认通过，最后删除临时文件并撤销 `turbo.json` 的临时改动。

## 4. 文档

- [x] 4.1 创建 `docs/toolchain.md`，记录平面模型、根目录 / `@inkstack/config` / 包级 script 的所有权、`pnpm format` / `pnpm format:check` / `pnpm lint` / `pnpm lint:env` 的语义、oxfmt 与 oxlint 的精确 pin 策略、`eslint-plugin-turbo` 的 peer 处理理由，以及推迟项（Node 升级、vitest、应用依赖、CI/Renovate）；对照根 `package.json` 检查文中命令均真实存在。
- [x] 4.2 更新 `docs/AGENTS.md` 的权威表，增加"工具链配置 → `docs/toolchain.md`"；更新 `docs/package-metadata.md`，把 lint/format 从"非目标"中移除并保留发布版本、CI、OpenWiki 为非目标；更新根 `AGENTS.md` 的"依赖与工具链"段，补充 format/lint 命令与文档链接；运行字数检查，确认根 `AGENTS.md` 手写区仍 ≤70 行且 ≤3,200 非空白字符。

## 5. 集成验证

- [x] 5.1 依次运行 `pnpm install`、`pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm check:manifests`，确认全部退出码为 0。
- [x] 5.2 运行 `git diff --stat` 与 `git status --short`，确认改动只包含本变更声明的配置文件、依赖清单、lockfile、contracts 的 lint script 与文档；确认没有引入 vitest、Node 版本或任何应用运行时依赖。oxfmt 的全仓库格式化 diff 已获用户确认，作为本次的预期结果。

## Workflow follow-up

- 变更实现并验证完成后，按项目流程运行 `/opsx:archive`。
- 归档前确认工作区改动已由用户检查，不代用户执行提交。
