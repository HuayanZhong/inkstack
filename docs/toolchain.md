# 工具链配置

本文是 format、lint 与 Turborepo 环境变量检查的唯一 home。tsconfig 与测试配置不在本文范围。

## 平面模型

| 平面   | 典型路径                                 | 运行时特征   | 配置方式                                      |
| ------ | ---------------------------------------- | ------------ | --------------------------------------------- |
| 浏览器 | `apps/shell`、`apps/canvas`              | DOM、bundler | `tsconfig.react/next` + lint browser override |
| Node   | `apps/gateway`、`apps/bff`、`packages/*` | Node ESM     | `tsconfig.node/nest` + lint node override     |
| AI     | 未来的 `packages/ai-*`                   | Node ESM     | `tsconfig.node` + lint node override          |

## 所有权

| 内容                     | 位置                        | 原因                            |
| ------------------------ | --------------------------- | ------------------------------- |
| 全仓库 lint 规则         | 根 `.oxlintrc.json`         | 工具从仓库根读取一次            |
| Turbo 环境变量检查       | 根 `.oxlintrc.turbo.json`   | 规则需要 workspace 根上下文     |
| 格式规则                 | 根 `.oxfmtrc.json`          | 与环境无关                      |
| 每个包的 lint 命令       | 包内 `package.json` scripts | 只有包自己知道源码入口          |
| 共享 tsconfig / 测试预设 | `packages/config`           | 每个包需要主动 extends / import |

环境差异用根配置的 `overrides[].files` 表达。不要在包内新建 `.oxlintrc.json`；只有"调用方式不同"才拆文件，例如 staged 检查需要关闭 type-aware。

## 命令

| 命令                | 作用                                 |
| ------------------- | ------------------------------------ |
| `pnpm format`       | oxfmt 写入全仓库                     |
| `pnpm format:check` | 只检查格式，CI 使用                  |
| `pnpm lint`         | turbo 包级 lint + Turbo 环境变量检查 |
| `pnpm lint:env`     | 只跑 Turbo 环境变量检查              |

## 版本策略

- `oxlint`、`oxlint-tsgolint`、`oxfmt` 固定在 `toolchain` catalog，精确 pin。
- `oxlint` 与 `oxlint-tsgolint` 成对升级；两者没有 peer 约束，版本错配只会在运行期暴露。
- oxfmt 处于 0.x，升级作为独立提交，升级后必须跑 `pnpm format:check` 并审查 diff。
- 未来接入 Vitest 时，`vite` 必须是 8.x；Vitest 4 的 peer 允许 6/7/8，解析到旧版本会丢失 Nest 的装饰器元数据。

## lint 规则组织

- 共享规则只写一次；浏览器、Node、Nest 的差异放在 `overrides`。
- 不启用 `@stylistic/*`：格式由 oxfmt 负责，两个工具同时改格式会互相覆盖。
- Gateway 关闭三条规则：`typescript/no-extraneous-class`、`no-useless-constructor`、`typescript/consistent-type-imports`。前两条误伤 Nest Module 与纯注入构造函数；第三条会把值导入改成 `import type`，导致 `emitDecoratorMetadata` 丢失类引用。
- 公共导出符号的 TSDoc 要求见 [`.claude/rules/comments.md`](../.claude/rules/comments.md)。

## Turbo 环境变量检查

- `eslint-plugin-turbo` 通过 oxlint 的 `jsPlugins` 加载，规则为 `turbo/no-undeclared-env-vars`。
- `eslint` peer 通过 `peerDependencyRules.ignoreMissing` 忽略。依据：插件构建产物中 `eslint` 只出现在 `import type`，运行时由 oxlint 提供 ESLint v9 兼容接口。
- 框架前缀白名单（`NEXT_PUBLIC_*`、`VITE_*`）只用于降低噪音；缓存正确性仍以 `turbo.json` 的显式 `env` / `globalEnv` 声明为准。
- 新增环境变量的顺序：先写入 `turbo.json`，再在代码中引用。

## 格式范围

- oxfmt 覆盖仓库内所有它支持的格式；这是当前接受的策略。挂到 husky 之后，pre-commit 只处理 staged 文件。
- `.oxfmtrc.json` 只忽略 `node_modules`、`dist`、`.next`、`coverage`。
- `docs/architecture/interactive/*.html` 是生成物。格式化后如果重新生成，以生成器输出为准，不要手改。

## 推迟项

- Node 升级到 24.15+（解锁 `@nestjs/schematics` 与 `jsdom`）。
- Vitest / Vite 安装与 `node` / `react` / `nest` / `browser` 预设。
- Nest / Next / React / tldraw / AI SDK 等运行时依赖。
- pre-commit hook、CI 与 Renovate 配置。
