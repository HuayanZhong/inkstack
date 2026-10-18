# Proposal

## Why

仓库目前只有 lint、typecheck 与 manifest 检查，无法发现死文件、无人引用的导出、未使用依赖、未声明依赖，以及 `exports` 映射指向不存在产物的问题。实际用 knip 与 publint 试跑墨栈已经复现了这些腐烂：canvas 残留脚手架依赖、BFF 的 `nest-cli.json` 引用未声明的 `@nestjs/schematics`、多个无人使用的导出。骨架阶段不处理，后续每新增一个包都会继续放大。

## What Changes

- 引入 knip 做全仓库一次分析，覆盖死文件、死导出/类型、未使用依赖、未声明依赖、循环依赖与未使用 catalog 条目。
- 引入 publint 校验库包的 `package.json` 导出映射；只对声明了 `exports` 的包运行。
- 新增根命令 `pnpm hygiene`（`knip && turbo run publint`），并在 pre-push 的 typecheck 之后执行。
- `turbo.json` 增加 `publint` 任务，`dependsOn: ["build"]`，确保 `dist` 在检查前存在。
- 新增 `knip.jsonc`，显式声明源码入口，并为 vendored 目录、CLI-only 依赖写明 ignore 理由。
- 修复首次运行发现：移除 canvas 的 `autoprefixer`、`css-loader`、`ts-node`；为 BFF 补 `@nestjs/schematics`；清理无人使用的导出；把 `commitlint` 元包换成 `@commitlint/cli`，让 knip 的 commitlint 插件真正启用。
- 更新 `docs/toolchain.md` 与 `docs/package-metadata.md`，明确 hygiene 命令、publint 要求与 ignore 规则。

不做：不引入测试框架、不接入 CI、不增加文档死链检查或运行时结构约束；这些留给后续独立变更。

## Capabilities

### New Capabilities

- `repository-hygiene`: 自动发现死代码、未使用依赖、未声明依赖与无效包导出，并在发现时阻止推送。

### Modified Capabilities

无。

## Impact

- 依赖与 catalog：新增 `knip`、`publint`、`@nestjs/schematics`、`@commitlint/cli`；移除 `autoprefixer`、`css-loader`、`ts-node`、`commitlint`（`@types/express` 视实测结果决定去留）。
- 包清单：根、`apps/bff`、`apps/canvas`、`packages/config`、`packages/contracts`；`packages/tsconfig` 可选接入 publint。
- 配置与流程：新增 `knip.jsonc`；修改 `turbo.json`、根 `package.json`、`.husky/pre-push`。
- 文档：`docs/toolchain.md`、`docs/package-metadata.md`。
- 不改变任何应用的运行时行为与对外 API。
