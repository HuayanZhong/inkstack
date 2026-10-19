# CLI 优先

工具自带的 CLI 是它的公共接口：`pnpm` 管依赖，`turbo` 管任务与文档，`oxlint` / `oxfmt` 管质量，`openspec` 管规格，框架 CLI 管脚手架与代码生成，ORM CLI 管 schema 与迁移。凡是有官方命令的操作，就用命令，不要手写它的产物。

手写的代价不是多敲几行，而是产物和工具的状态对不上：lockfile 与 `package.json` 脱节、schema 与迁移漂移、生成器负责的注册代码漏项、升级时没有可对照的基线。

## 用哪个命令

| 领域     | 用                                                                  | 不要                                    |
| -------- | ------------------------------------------------------------------- | --------------------------------------- |
| 依赖     | `pnpm add` / `remove` / `approve-builds`                            | 手改 `package.json` 版本、手删 lockfile |
| 任务     | `pnpm <script>`、`turbo run`、`turbo docs`                          | 绕过 turbo，直接在多个包里拼命令        |
| 质量     | `oxlint`、`oxfmt`                                                   | 手改格式、在包内另建规则文件            |
| 规格     | `openspec new change`、`openspec validate`                          | 手建 `openspec/changes/` 目录           |
| 脚手架   | `create next-app`、`create vite`、`nest new`                        | 手写最小项目树                          |
| 代码生成 | `nest g module\|controller\|service`、ORM 的 entity/schema/迁移命令 | 手写模块注册代码、手写迁移脚本          |
| 服务     | `next dev`、`vite`、`nest start`                                    | 自己拼 `tsc` + `node`                   |

## 脚手架

| 目标         | 命令                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| Next.js      | `pnpm create next-app@latest <dir> --ts --app --skip-install`                      |
| Vite + React | `pnpm create vite@latest <dir> --template react-ts`                                |
| NestJS       | `pnpm dlx @nestjs/cli new <name> --package-manager pnpm --skip-git --skip-install` |
| 纯 TS 库     | 没有权威 CLI，复制现有 `packages/contracts` 的结构                                 |

参数以各 CLI 的 `--help` 输出为准，不要凭记忆拼选项；不确定的选项宁可先跑 `--help`。

## 生成器

| 场景             | 命令                                                            | 说明                                          |
| ---------------- | --------------------------------------------------------------- | --------------------------------------------- |
| NestJS 模块/资源 | `pnpm exec nest g module\|controller\|service\|resource <name>` | 在应用目录内运行；`g resource` 生成 CRUD 全套 |
| Next.js / Vite   | 无官方生成器                                                    | 组件与页面手写，沿用现有结构                  |
| OpenSpec 变更    | `openspec new change <name>`                                    | 不要手建 `openspec/changes/` 目录             |
| 依赖             | `pnpm add` / `pnpm remove`                                      | 不手改 `package.json`                         |

## 生成后必须对齐

- 在临时目录生成再并入目标目录。目标目录已有占位文件时 CLI 会拒绝或覆盖，不要为此删除仓库文件。
- 脚手架写入的依赖版本一律换成 catalog 引用，新增条目加到 `pnpm-workspace.yaml`，不保留裸 semver。
- 删除 CLI 自带的锁文件、`.git`、示例 README，以及模板生成的 lint / format / test 配置（不同版本的产物不同，以实际生成结果为准）。仓库统一用根 oxlint / oxfmt，测试按阶段策略处理。
- 按 [`docs/package-metadata.md`](../../docs/package-metadata.md) 改写 `package.json`：`@inkstack/<kebab-case>`、`0.0.0`、`private: true`、`license: ISC`、40–120 字符描述。
- `tsconfig.json` 改为继承 `@inkstack/tsconfig/<preset>.json`，并在 devDependencies 声明 `"@inkstack/tsconfig": "workspace:*"`。
- 补齐 `dev`、`build`、`lint`、`typecheck` 四个 scripts。
- 创建该层 `AGENTS.md` 和只写 `@AGENTS.md` 的 `CLAUDE.md`。
- 脚手架的产物必须能真实启动：`pnpm dev` 能起服务、`pnpm build` 能产出，不要把生成物删到只剩空文件。
- 完成后跑 `pnpm install`、`pnpm check:manifests`、`pnpm typecheck`。

## 事实核验

计划与实现里的版本、API、CLI 选项和脚手架产物，必须来自当前实际来源，不凭模型记忆：

- 仓库已安装版本：`node_modules`、`package.json`、lockfile。
- registry：`pnpm view <pkg> version peerDependencies`。
- 与版本匹配的官方文档；优先随安装包分发或明确标注版本的文档。
- CLI 行为：`--help`、`--dry-run`，或临时目录里的实际生成结果。

来源之间冲突时以实际安装版本为准；无法核实的内容标为假设，并在实现前向用户确认。计划中写明核对方式，例如“读取 `@nestjs/schematics@12.0.7` 的 `application/files/ts-esm`”。

## 边界

- CLI 不替你判断：跑生成器前先看它会写哪些文件，生成后 review 改动。
- 工具没有命令的环节（业务逻辑、React 组件结构）就手写，沿用现有目录与写法。
- CLI 的默认项与仓库约定冲突时，以仓库约定为准，但保留它生成的文件结构与配置项。
- 生成代码里的英文注释同样要改成中文，见 [`comments.md`](comments.md)。
