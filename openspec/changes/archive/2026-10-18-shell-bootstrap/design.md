# Design

## Context

动机见 [proposal.md](proposal.md)。设计相关的现状：

- `apps/shell` 只有占位 `package.json`，没有 `src/`、没有 scripts，因此 `turbo run dev` 当前没有任何可执行任务。
- `packages/tsconfig/next.json` 已存在（`jsx: preserve`、`noEmit`、`types: ["node"]`），但从未被应用消费。
- `.oxlintrc.json` 已经为 `apps/shell/**/*.{ts,tsx}` 配置了 browser 环境与 `react` / `jsx-a11y` / `nextjs` 插件，同样没有消费者。
- 根 `.gitignore` 已覆盖 `.next/`、`out/`、`next-env.d.ts`、`*.tsbuildinfo`。

已用 `create-next-app@16.4.2` 在临时目录实跑过一次，确认了模板产物：它会在应用目录内生成 `pnpm-workspace.yaml`、`.gitignore`、示例 SVG 与 `next/font/google` 的 Geist 字体。

## Goals / Non-Goals

**Goals:**

- `apps/shell` 能通过仓库根命令 `dev` / `build` / `lint` / `typecheck` 被驱动。
- 应用级配置符合仓库既有约定：catalog 依赖、tsconfig 预设、根 oxlint 规则、`@inkstack/*` 命名。
- 保持脚手架原始结构，只做必要改写，方便后续对照上游升级。

**Non-Goals:**

- 不做任何跨应用调用（iframe、HTTP、contracts 消费）。
- 不引入 UI 库、状态管理、路由分组、鉴权。
- 不处理 production 部署配置（`output`、Dockerfile、环境变量）。

## Decisions

### 1. 在临时目录生成，再并入 `apps/shell`

```bash
pnpm create next-app@latest <tmp>/shell \
  --ts --app --src-dir \
  --no-eslint --no-tailwind --no-agents-md \
  --skip-install --disable-git --use-pnpm
```

`apps/shell` 已存在占位文件，`create-next-app` 会拒绝非空目录。不删除占位文件，而是在临时目录生成后合并。

选项理由：

- `--no-eslint`：仓库用 oxlint；留着 ESLint 配置会变成没人维护的第二套规则。
- `--no-tailwind`：首个应用不需要 UI 框架，避免把 Tailwind 的构建链提前拉进来。
- `--no-agents-md`：模板会生成它自己的 `AGENTS.md`，与仓库的分层规则冲突，改为手写。
- `--skip-install`：依赖版本必须由 catalog 决定，模板写入的裸 semver 会在合并时统一改写。
- `--disable-git`：应用目录不单独初始化仓库。
- 未使用 `--empty`：它会去掉 `globals.css` 等基线，反而要手写更多。

合并时只删除模板带来的 `pnpm-workspace.yaml`（会在应用下形成嵌套 workspace 根，并静默关闭 `sharp` 等构建脚本）、`.gitignore`（根已覆盖）与模板 `README.md`；随后写入本仓库自己的 `README.md`（职责、运行命令、文档入口）。**`public/` 下的示例资源与全部样式文件保留**，页面改写只替换文案与链接，不删除样式文件，避免误删后还要重写。

### 2. 页面：保留模板样式，只换字体与文案

**保留**模板的 `globals.css`、`page.module.css`、`public/` 资源与页面结构，改写建立在它们之上，不重写一套样式。

必须改的只有两类：

- 删除 `next/font/google` 的 Geist 引用与 `<html className>`；`globals.css` 已有 `font-family: Arial, Helvetica, sans-serif`，补上中文回退（`"PingFang SC"`、`"Microsoft YaHei"`）。
- `lang` 改 `zh-CN`，`metadata` 与页面文案改为产品名与一句话说明。

理由：`next/font/google` 在构建期下载字体，离线或受限网络下 `pnpm build` 直接失败；骨架页不该有这个依赖。样式沿用模板则避免手写 CSS 时引入排版问题。

### 3. `tsconfig.json` 保留模板选项，加 `extends`

模板生成的 `compilerOptions`（`target: ES2017`、`jsx: react-jsx`、`paths`）与 `packages/tsconfig/next.json` 有重叠且个别值不同（预设是 `jsx: preserve`）。

决定：**应用级保留模板写出的值，只增加 `"extends": "@inkstack/tsconfig/next.json"`**，应用级的值覆盖预设。Next 在首次 `dev` / `build` 时会校验并可能改写 `tsconfig.json`，以它最终写回的值为准；如果它把 `jsx` 改回 `preserve`，同步修正 `next.json` 与 `docs/typescript.md`。

理由：Next 对 tsconfig 有强制要求，硬把它改成预设的值只会在下次运行时被改回来。预设在这里的价值是 `strict`、`noUnused*` 等语言级选项，不是覆盖框架自己管理的字段。

### 4. scripts

| script      | 命令                                                  |
| ----------- | ----------------------------------------------------- |
| `dev`       | `next dev -p 3000`                                    |
| `build`     | `next build`                                          |
| `start`     | `next start -p 3000`                                  |
| `lint`      | `oxlint --config ../../.oxlintrc.json --type-aware .` |
| `typecheck` | `next typegen && tsc --noEmit`                        |

`next-env.d.ts` 在根 `.gitignore` 里，clean checkout 下不存在，先跑 `next typegen` 生成类型再检查，避免 `typecheck` 依赖"先 build 过一次"。若 `next typegen` 不可用，退回 `tsc --noEmit` 并把这一限制写进 `docs/typescript.md`。

端口写死 3000 而不是读 `PORT`：骨架期不引入环境变量，避免触发 `turbo/no-undeclared-env-vars` 并要求在 `turbo.json` 声明。

### 5. 依赖全部走 catalog

`pnpm-workspace.yaml`：

```yaml
catalogs:
  runtime:
    next: ^16.4.2
    react: ^19.3.0
    react-dom: ^19.3.0
  dev:
    '@types/react': ^19.3.0
    '@types/react-dom': ^19.3.0
```

`packages/*` 同理。应用 `package.json` 中 `typescript` 用 `catalog:toolchain`（精确 6.0.3），`@types/node` 用 `catalog:dev`（已有 ^26.6.5），`@inkstack/tsconfig` 用 `workspace:*`。删除模板写入的 `packageManager` 字段，由根统一声明。

## Risks / Trade-offs

- **Next 改写 tsconfig** → 首次 `dev` / `build` 后执行 `git diff apps/shell/tsconfig.json`，按它写回的值调整预设或文档，而不是反复对抗。
- **`next typegen` 不存在或行为不同** → `typecheck` 退回 `tsc --noEmit`，并在 `docs/typescript.md` 记录"typecheck 前需先生成 `next-env.d.ts`"。
- **`sharp` / `unrs-resolver` 构建脚本被忽略** → 若 `pnpm install` 报 `ERR_PNPM_IGNORED_BUILDS`，在根 `pnpm-workspace.yaml` 增加 `allowBuilds` 或用 `pnpm approve-builds`。
- **oxlint type-aware 扫描 `.next` 生成物** → 根 `ignorePatterns` 已排除 `**/.next/**`；若仍有噪音，在应用级不新增规则文件，改为调整根配置。
- **`cacheComponents` / `partialPrefetching` 是 Next 16 默认值** → 保持模板默认，不在骨架期调整；真出现行为问题时再单独评估。
