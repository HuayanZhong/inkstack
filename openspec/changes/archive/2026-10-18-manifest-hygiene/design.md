# Design

## Context

参见 `proposal.md` 的 Why。当前约束：

- 根 `AGENTS.md` 62 行 / 2,707 非空白字符，上限 3,200；`docs/AGENTS.md` 25 行 / 797 非空白字符，上限 1,000。
- 7 个 manifest：根有描述、license、repository、engines；6 个包只有 name/version/private，缺少描述与 license。
- catalog 只有一个 `dev`，混合了精确 pin 与 caret 范围。
- 尚未配置 tsconfig 分发、lint、format；这些将在后续单独决策，本次不能把它们写死。
- 所有包 `private: true`，没有发布流程；发布版本属于 CD 里程碑。

## Goals / Non-Goals

**Goals：**

- 让包元数据有统一的最小标准，并能被一个本地脚本检查。
- 让依赖和工具链版本有明确的 catalog 分类与范围策略。
- 修正已确认的 TypeScript "固定"漂移。
- 不引入任何与配置分发或发布流程耦合的规则。

**Non-Goals：**

- 不决定 tsconfig / lint / format 如何拆包、命名或分发。
- 不改变任何包版本，不引入 Changesets、changelog、git tag。
- 不添加 `keywords`、`author` 对象、`repository`、包级 `engines`、`publishConfig`、`sideEffects`。
- 不检查字段顺序，不引入 `sort-package-json`。
- 不检查包的 `type` 或 tsconfig 继承。
- 不接 CI / pre-commit，不碰 OpenWiki 或架构图 JSON。

## Decisions

### 1. 只修 manifest 元数据、依赖范围和检查，不修配置分发

本轮只修改 `package.json`、`pnpm-workspace.yaml`、检查脚本和相关文档。`packages/config` 只补 `description` / `license`，不改变 `exports`、`files`、`scripts`，也不为它添加 tsconfig 或 lint 规则。

备选方案是顺便把配置包也规范化；放弃，因为配置分发方案尚未决策，现在写规则会立刻过时。

### 2. catalog 拆成 `toolchain` / `dev` / `runtime`

```yaml
catalogs:
  toolchain:
    typescript: 6.0.3
    '@fission-ai/openspec': 1.14.3
  dev:
    '@types/node': ^24.19.2
    turbo: ^2.11.9
    commitlint: ^21.2.3
    '@commitlint/config-conventional': ^21.2.3
    husky: ^9.1.7
    yaml: ^2.9.1
  # runtime: 首个运行时依赖进入时创建
```

- `toolchain` 只放需要精确 pin、且影响构建或类型的包；`dev` 放开发工具与类型包，允许 minor/patch 浮动。`@types/node` 的主版本跟随 Node。
- `runtime` 先留空，等 Next / tldraw / Nest / AI SDK 进入。

备选方案是保留单一 `dev` catalog；放弃，因为运行时依赖进入后名字会持续误导，且无法用规则区分 pin 与浮动。

### 3. 版本规则只做一致性提醒，不做发布策略

- 所有私有 workspace 包保持 `0.0.0`；根 `version` 暂不修改。
- 检查脚本对"私有包版本不是 `0.0.0`"输出 **warning**，不失败。
- 发布版本、`0.1.0` / `1.0.0`、Changesets、tag、changelog 全部留到 CD 里程碑。

备选方案是现在就统一 root 与包版本；放弃，因为那会提前引入发布语义，而当前没有消费者。

### 4. description 用英文一句话

- 包级描述使用英文，npm 生态可读；仓库文档继续中文。
- 规则：非空、40–120 字符、不等于包名、描述"做什么"而不是"是什么类别"。
- 根描述包含产品名与领域：`Inkstack — an AI design-to-code canvas with agent pen control, manual editing, and deterministic code generation.`
- 检查脚本只验证形态（长度、非空、不等于 name），不判断语义质量。

备选方案是中文描述；放弃，因为包名与 npm 元数据是英文生态，且未来发布时不必再翻译。

### 5. license 与 type

- 所有 manifest 统一 `license: ISC`，与根 `LICENSE` 一致。
- `type` 只明确已有决定：根 `module`、`@inkstack/contracts` `commonjs`。
- apps 和 `@inkstack/config` 保持未声明；不检查 `type`，等框架落地和配置分发方案确定后再定。

备选方案是现在给所有包加 `type`；放弃，因为 Next / Nest / 配置包的模块格式尚未决定。

### 6. 检查脚本用一个零业务依赖的 Node ESM 脚本

`scripts/check-manifests.mjs`：

- 读取根、`apps/*`、`packages/*` 的 `package.json`；
- 用 `yaml` 解析 `pnpm-workspace.yaml` 的 catalogs；
- 规则：
  1. 名称：根 `inkstack`，其余 `@inkstack/<kebab-case>`；
  2. `private: true`；
  3. `description` 非空、40–120 字符、不等于 name；
  4. `license` 为 `ISC`；
  5. 外部依赖只允许 `catalog:*`，内部依赖只允许 `workspace:*`；
  6. `toolchain` catalog 的每个值必须是精确版本（无 `^` / `~`）；
  7. `.nvmrc` 等于 `engines.node` 的下界；`packageManager` 等于 `devEngines.packageManager.version`；
  8. 根有 `dev` / `build` / `lint` / `typecheck` scripts；有 `src` 的包有 `build` / `typecheck`；apps 与 config 暂不强制；
  9. 私有包版本不是 `0.0.0` 时输出 warning。
- 错误退出码 1，warning 不影响退出码。
- 根脚本：`"check:manifests": "node scripts/check-manifests.mjs"`。

`yaml` 作为 devDependency 走 `catalog:dev`，只用于脚本，不进入运行时。

备选方案是引入 `@manypkg/cli` 或 `syncpack`；放弃，因为它们覆盖不了 description / license / 版本提醒这些项目特有规则，而且当前规模不值得再加一个工具链。

### 7. 策略文档放在 `docs/package-metadata.md`

内容包括：

- 三层版本（发布 / 依赖 / 工具链）；
- catalog 分类与范围规则；
- 字段标准与描述规则；
- 检查脚本的规则清单；
- 非目标：tsconfig / lint / format 分发、发布流程。

`docs/AGENTS.md` 的权威表增加一行"包元数据与版本策略 → `docs/package-metadata.md`"。如果因此超过 25 行，压缩一条现有规则（例如把 OpenWiki 的两句合并）。

备选方案是把策略塞进根 `AGENTS.md`；放弃，因为根文件只剩约 490 字符余量，放不下表格。

### 8. 检查脚本先本地运行，不接 CI

脚本通过 `pnpm check:manifests` 手动运行；等 CI 恢复后再接入。现在不写 pre-commit，因为 lint / hooks 的配置分发也在后续决策中。

## Risks / Trade-offs

- [新增 `yaml` devDependency] → 只放在 `dev` catalog，脚本不进入运行时；如果不想加依赖，可改用最小解析器，但会更脆。
- [catalog 拆分导致引用遗漏] → 本次只有根 `package.json` 引用 catalog，改动面小；脚本检查 `catalog:*` 的键存在。
- [description 质量无法机械判断] → 检查只覆盖长度/形态；语义由评审负责。
- [版本 warning 被误读为发布策略] → 文档明确"warning 仅防止手写漂移，发布版本属于 CD"。
- [docs/AGENTS.md 超过 25 行] → 加行时同步压缩；验证行数与字符数。
- [检查脚本随包类型变化而过时] → 规则保持最小；包类型专属规则等实现时再加。

## Migration Plan

1. 修改 catalog 与 manifest 后运行 `pnpm install`，更新 lockfile。
2. 运行 `pnpm check:manifests`、`pnpm typecheck`、`pnpm build`。
3. 回滚方式是还原上述文件并重新 `pnpm install`；无运行时迁移。

## Open Questions

无。
