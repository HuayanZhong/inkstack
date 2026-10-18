# Tasks

## 1. 依赖与 catalog

- [x] 1.1 通过 pnpm 把 `knip`、`publint` 加入 `dev` catalog 与根 devDependencies；确认 `pnpm install` 成功，且 `package.json` 写入的是 `catalog:dev` 而不是裸版本。
- [x] 1.2 把根依赖 `commitlint` 替换为 `@commitlint/cli`，同步 catalog；用 `echo "chore: 验证提交信息" | pnpm lint:commit` 确认提交信息校验仍可运行。
- [x] 1.3 为 `apps/bff` 增加 `@nestjs/schematics` devDependency，并移除 `apps/canvas` 的 `autoprefixer`、`css-loader`、`ts-node`；删除对应 catalog 条目后跑 `pnpm install`、`pnpm --filter @inkstack/canvas build`、`pnpm --filter @inkstack/bff typecheck`，确认三者都通过。
- [x] 1.4 尝试移除 `apps/bff` 的 `@types/express` 并跑 `pnpm --filter @inkstack/bff typecheck`；通过则连同 catalog 条目删除，不通过则保留，并在后续 knip 配置中按设计记录忽略理由。

## 2. knip 配置与首次清理

- [x] 2.1 新增根 `knip.jsonc`：为根配置 `scripts/**/*.mjs` entry、`.agents/**` 与 `.claude/**` ignore、`@fission-ai/openspec` 的忽略理由；为 `packages/config`、`packages/contracts` 配置 `src/index.ts` entry；为 `apps/canvas` 配置 `rspack.config.ts`、`module-federation.config.ts`、`src/index.ts`；跑 `pnpm exec knip` 确认 vendored 脚本不再被报告。
- [x] 2.2 按 knip 输出清理无人使用的导出：`apps/shell/env.ts` 改为只执行校验、`apps/bff/src/config/env.ts` 移除 `BffEnv`、`apps/bff/src/config/index.ts` 移除 `AppConfig`；跑 `pnpm exec knip` 与 `pnpm typecheck`，确认这些导出问题消失且类型检查通过。
- [x] 2.3 确认换用 `@commitlint/cli` 后 knip 的 commitlint 插件生效：`commitlint.config.mjs` 不再出现在 unused files，`@commitlint/config-conventional` 不再出现在 unused devDependencies；用 `pnpm exec knip` 的输出验证。
- [x] 2.4 确认 `@types/express` 的处理与配置一致：若已移除则 knip 输出无该项；若保留则在 `knip.jsonc` 的 `ignoreDependencies` 中写明“Nest 声明文件间接依赖”，并确认 knip 不再报告。

## 3. publint 接入

- [x] 3.1 为 `packages/config`、`packages/contracts`、`packages/tsconfig` 增加 `publint` script 与 devDependency；分别构建后直接运行包内 `publint`，确认三个包都通过（`tsconfig` 的 `type` suggestion 不视为失败）。
- [x] 3.2 在 `turbo.json` 增加 `publint` 任务，`dependsOn: ["build"]`、`outputs: []`，并写中文 description；删除三个包的 `dist` 后跑 `pnpm turbo run publint`，确认它先构建再检查并成功。
- [x] 3.3 临时把 `packages/config` 的 `exports` 指向不存在的文件，跑 `pnpm turbo run publint` 确认失败并指出包名与目标；恢复 `exports` 后确认重新通过。

## 4. 命令与门禁

- [x] 4.1 在根 `package.json` 增加 `"hygiene": "turbo run build --filter \"./packages/*\" && knip && turbo run publint --filter \"./packages/*\""`；在干净状态下运行 `pnpm hygiene`，确认退出码为 0。
- [x] 4.2 在 `.husky/pre-push` 的 `pnpm typecheck` 之后加入 `pnpm hygiene`；直接执行该 hook 脚本确认两条命令都运行，再临时新增一个无人引用的源文件确认 hook 以非零状态失败，删除该文件后恢复通过。

## 5. 文档

- [x] 5.1 更新 `docs/toolchain.md`：命令表加入 `pnpm hygiene`，Git hooks 一节的 pre-push 改为 typecheck + hygiene，新增“死代码与包边界检查”小节说明 knip/publint 的职责、入口与忽略规则；跑 `pnpm format:check` 确认格式通过。
- [x] 5.2 更新 `docs/package-metadata.md` 的检查规则：有 `exports` 的包必须声明 `publint` script；跑 `pnpm check:manifests` 确认清单检查通过。

## 6. 集成验证

- [x] 6.1 依次运行 `pnpm install`、`pnpm check:manifests`、`pnpm typecheck`、`pnpm build`、`pnpm hygiene`，确认全部成功并记录实际输出。
- [x] 6.2 验证未使用依赖与未声明依赖能被发现：临时在 canvas 增加一个未使用的 devDependency、在 bff 的配置中引用一个未声明的包，分别确认 knip 以非零状态退出并指出问题；恢复后确认通过。
- [x] 6.3 验证构建失败会阻止导出检查：临时让 `packages/contracts` 的构建失败，跑 `pnpm hygiene` 确认 publint 不会在旧产物上继续通过；恢复构建后确认全绿。

## Workflow follow-up

- 评审通过后归档该变更，并在归档前重新运行一次 `pnpm hygiene`。
