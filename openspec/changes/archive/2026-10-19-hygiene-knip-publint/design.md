# Design

## Context

墨栈是 pnpm + Turborepo 的单仓库：`apps/shell`（Next.js）、`apps/canvas`（Rspack + Module Federation）、`apps/bff`（NestJS），以及 `packages/config`、`packages/contracts` 两个构建到 `dist` 的库包和只分发 JSON 预设的 `packages/tsconfig`。当前没有测试与 CI，本地门禁只有 pre-commit 的 lint-staged 和 pre-push 的 typecheck。依赖版本统一走 catalog。

已用 knip 6.34.0 与 publint 0.3.24 在当前工作区做了只读试跑，确认存在真实问题，也确认 Next、Nest、Rspack、tsconfig extends 等场景不需要额外配置就能被识别。设计以此为依据，不照搬 Growth OS 的配置。

## Goals / Non-Goals

**Goals:**

- 用一条根命令同时完成全仓库死代码/依赖检查与库包导出检查。
- 在干净检出中结果稳定，不依赖本地是否已有 `dist`。
- 首次接入就把已发现的问题修掉，避免带着红色基线开始。
- 每条忽略都有明确范围和理由。
- 在没有 CI 的阶段，用 pre-push 承担门禁。

**Non-Goals:**

- 不引入测试框架、CI job、Changesets 或发布流程。
- 不检查文档死链、环境变量冗余、运行时死分支。
- 不裁决公共 API 是否应该保留；entry 导出的裁剪仍由评审负责。
- 不改变任何应用的运行时行为。

## Decisions

### 1. knip 用根目录单进程，而不是按包跑 turbo

knip 的 monorepo 模式一次分析所有 workspace，能看到跨包的引用关系、未使用的 catalog 条目和未声明依赖。拆成包级 turbo 任务会重复配置，并丢掉跨包视角。代价是无法利用 turbo 的包级缓存，但当前仓库规模下开销可以忽略。

替代方案：每个包单独跑 knip。放弃原因是配置重复且无法统一处理 catalog。

### 2. publint 作为包级 script + turbo 任务，`dependsOn: ["build"]`

只有声明了 `exports` 的库包需要 publint；应用没有导出映射，不参与。放在包级 script 里可以让 turbo 只跑有该 script 的包，并复用构建缓存。

墨栈的库包入口指向 `dist`，因此任务必须依赖同一个包的 `build`，而不是只依赖 `^build`。这样干净检出会先构建再打包检查。

替代方案：在根目录直接遍历 `packages/*` 调 publint。放弃原因是绕过 turbo 缓存，也无法表达构建依赖。

### 3. `knip.jsonc` 显式声明库包源码入口

`packages/config` 与 `packages/contracts` 的 `package.json` 入口指向 `dist`。如果 knip 从 `exports` 推导入口，结果会随本地是否构建过而变化；在干净检出中还可能把入口判为 unresolved。显式写 `entry: ["src/index.ts"]` 后，分析对象始终是源码。

其余 workspace 交给 knip 的内置插件：Next 识别 `next.config.ts` 与 app router，Nest 识别 `src/main.ts`，Rspack 通过 `rspack.config.ts` 与 `src/index.ts` 入口可达。试跑已证明不需要额外 entry。

替代方案：完全不写 entry，依赖 `package.json` 的 `exports`。放弃原因是结果不确定。

### 4. 忽略分三类，并且都写理由

- `ignore`：`.agents/**` 与 `.claude/**`。这些目录是 vendored 技能与视图，不属于仓库代码。
- `ignoreDependencies`：`@fission-ai/openspec` 由技能工作流调用 CLI，源码不 import；`@types/express` 由 Nest 声明文件间接需要，源码不直接 import。
- `ignoreIssues`：只在确有“当前未用但属于基础设施”的文件或符号时使用，精确到文件。

不使用整类关闭或宽泛目录忽略。理由写在 `knip.jsonc` 的中文注释里，配置本身就是记录位置。

替代方案：把所有误报先塞进 `ignore`。放弃原因是工具会失去发现能力，和 Growth OS 记录的教训一致。

### 5. 把 `commitlint` 元包换成 `@commitlint/cli`

knip 的 commitlint 插件以 `@commitlint/cli` 作为 enabler。当前根依赖是 `commitlint` 元包，插件不会启用，于是 `commitlint.config.mjs` 和 `@commitlint/config-conventional` 都被误报。换成官方 CLI 包后，插件自动识别配置文件并从 `extends` 解析依赖，不需要 entry 或额外 ignore。

替代方案：保留元包，把配置文件加进 root entry，再忽略 `@commitlint/config-conventional`。放弃原因是只处理症状，且多出两条永久配置。

### 6. `@types/express` 默认保留并忽略，移除需通过 typecheck

BFF 源码没有 import express，但 `@nestjs/platform-express` 的声明文件引用了 express 类型，而 express 5 不自带类型。直接删除存在类型解析风险。实施时先尝试删除并跑 BFF typecheck；通过则连同 catalog 条目一起删除，不通过则保留并写入 `ignoreDependencies`，理由为“声明文件间接依赖”。

替代方案：直接删除。放弃原因是风险不可控，且 skipLibCheck 可能掩盖问题。

### 7. pre-push 承担门禁，CI 接入后再迁移

当前没有 CI，`pnpm hygiene` 放在 pre-push 的 typecheck 之后，是唯一能自动阻止问题进入远程仓库的位置。knip 与 turbo 缓存后的 publint 开销在秒级。CI 接入后把 hygiene 拆成独立 job，pre-push 是否保留再决定。

替代方案：只提供手动命令。放弃原因是没有自动执行点，问题仍会积累。

### 8. publint 覆盖 `config`、`contracts` 与 `tsconfig`

前两个包的入口是 `dist`，导出映射错误会直接破坏 BFF 的 Node ESM 导入。`packages/tsconfig` 虽然只有 JSON 导出，但预设文件重命名后 `exports` 容易腐烂，publint 可以验证目标存在；它当前只会输出一条“未声明 type”的 suggestion，不影响退出码。

应用包不参与，因为它们没有 `exports`。

### 9. hygiene 先构建库包，再运行 knip

knip 会把 `rspack.config.ts` 当作入口加载，而该配置 import 的 `@inkstack/config` 指向 `dist`。干净检出没有 `dist` 时，knip 会因模块解析失败而报错。因此根命令先执行 `turbo run build --filter "./packages/*"`，再运行 knip 与 publint；构建结果由 turbo 缓存，重复执行开销很小。

替代方案：把 `rspack.config.ts` 从入口与默认扫描中排除。放弃原因是会连带失去对该配置依赖的检查，并引入更多 ignore。

## Risks / Trade-offs

- 框架魔法造成误报 → 只用最小范围的 `ignoreDependencies` / `ignoreIssues`，每条写明调用方或原因；如果 ignore 持续增长，回头检查工具配置而不是继续放行。
- pre-push 变慢 → turbo 缓存构建产物；knip 当前规模在秒级。若明显影响推送体验，再评估移到 CI。
- knip 默认不报告 entry 文件的导出 → 库包的公共 API 裁剪仍需评审；这是有意的边界，不是缺陷。
- publint 依赖 `pnpm pack` → 包的 `files` 必须包含导出目标；`dependsOn: ["build"]` 保证产物存在。
- `@types/express` 判断错误 → 以 BFF typecheck 为唯一依据；失败就保留并记录忽略理由。
- knip 对动态引用可能漏判 → 只在确认属于框架约定时使用 `ignoreIssues`，不扩大到整目录。

## Migration Plan

1. 通过 pnpm 增加 knip、publint、`@nestjs/schematics`、`@commitlint/cli`，替换或移除对应旧依赖。
2. 新增 `knip.jsonc`，修改 `turbo.json` 与根 scripts。
3. 修掉首次运行发现的问题，直到 `pnpm hygiene` 通过。
4. 接入 pre-push 并更新文档。
5. 验证 typecheck、build、hygiene 与反向用例。

回滚：删除 `knip.jsonc`、还原 `turbo.json`、根 scripts、pre-push 与相关 package.json；不涉及运行时数据或 API，无迁移成本。
