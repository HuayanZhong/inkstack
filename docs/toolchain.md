# 工具链配置

本文是 format、lint 与 Turborepo 环境变量检查的唯一 home。tsconfig 见 [`docs/typescript.md`](typescript.md)；测试配置不在本文范围。

## 平面模型

| 平面   | 典型路径                                 | 运行时特征   | 配置方式                                                              |
| ------ | ---------------------------------------- | ------------ | --------------------------------------------------------------------- |
| 浏览器 | `apps/shell`、`apps/canvas`              | DOM、bundler | `@inkstack/tsconfig/react.json` / `next.json` + lint browser override |
| Node   | `apps/gateway`、`apps/bff`、`packages/*` | Node ESM     | `@inkstack/tsconfig/node.json` / `nest.json` + lint node override     |
| AI     | 未来的 `packages/ai-*`                   | Node ESM     | `@inkstack/tsconfig/node.json` + lint node override                   |

## 所有权

| 内容               | 位置                        | 原因                        |
| ------------------ | --------------------------- | --------------------------- |
| 全仓库 lint 规则   | 根 `.oxlintrc.json`         | 工具从仓库根读取一次        |
| Turbo 环境变量检查 | 根 `.oxlintrc.turbo.json`   | 规则需要 workspace 根上下文 |
| 格式规则           | 根 `.oxfmtrc.json`          | 与环境无关                  |
| 每个包的 lint 命令 | 包内 `package.json` scripts | 只有包自己知道源码入口      |
| 共享 tsconfig      | `packages/tsconfig`         | 每个包需要主动 extends      |

环境差异用根配置的 `overrides[].files` 表达。不要在包内新建 `.oxlintrc.json`；只有"调用方式不同"才拆文件，例如 staged 检查需要关闭 type-aware。测试预设将来放独立的 `@inkstack/vitest-config`，不回到 tsconfig 包。

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

## Turborepo 与 AI

- 版本匹配的文档随包分发：`node_modules/turbo/docs/README.md` 是入口。非扁平 `node_modules` 或 workspace 链接下，先用 `node -p "require.resolve('turbo/package.json')"` 解析包位置，再读其中的 `docs/README.md`。
- 检索用 `pnpm exec turbo docs "<关键词>"`；结果链接指向当前安装版本（如 `v2-11-9.turborepo.dev`），不要用未版本化的在线文档替代。
- 根 `AGENTS.md` 的 `<!-- BEGIN:turborepo-agent-rules -->` 块由 turbo 维护，只在检测到 agent 环境时刷新；只编辑块外内容，预算与链接检查跳过块内。
- `.agents/skills/turborepo/SKILL.md` 是上游 `vercel/turborepo` 同名 Skill 的副本，只做文档转发；升级 turbo 时对照一次上游文件。
- `turbo.json` 的每个任务必须写 `description`，说明「做什么 + 关键约束」，不要让人或 Agent 必须读包内 scripts 才能理解任务语义。

## 格式范围

- oxfmt 覆盖仓库内所有它支持的格式；这是当前接受的策略。挂到 husky 之后，pre-commit 只处理 staged 文件。
- `.oxfmtrc.json` 只忽略 `node_modules`、`dist`、`.next`、`coverage`。
- `docs/architecture/interactive/*.html` 是生成物。格式化后如果重新生成，以生成器输出为准，不要手改。

## Git hooks

- `commit-msg`：commitlint 校验提交信息，规则见 [`.claude/rules/git.md`](../.claude/rules/git.md)。
- `pre-commit`：`pnpm exec lint-staged`，只处理暂存文件。TS/JS 先 `oxfmt` 格式化，再 `oxlint --config .oxlintrc.staged.json`；Markdown、JSON、YAML、CSS、HTML 只格式化。任一任务失败时 lint-staged 会还原到运行前状态，格式修复也会丢弃；先修复错误再重新提交。
- `pre-push`：`pnpm typecheck`。Turborepo 缓存命中后开销很小；类型检查不放进 pre-commit。
- staged lint 关闭 `typeAware`：提交路径只做格式与基础正确性；类型检查由 pre-push 与 CI 负责，且根配置文件、`.mjs` 脚本不在任何包的 tsconfig 内。
- 规则仍只有根 `.oxlintrc.json` 一个 home；`.oxlintrc.staged.json` 只覆盖 `options`，不复制规则。
- `lint-staged` 版本固定在 `dev` catalog。

## 推迟项

- Vitest / Vite 安装与 `node` / `react` / `nest` / `browser` 预设。
- Nest / Next / React / tldraw / AI SDK 等运行时依赖。
- CI 与 Renovate 配置。
