# Tasks

## 1. 策略文档与文档链接

- [x] 1.1 创建 `docs/package-metadata.md`，写入三层版本、catalog 分类、字段标准、description 规则、检查规则和非目标。验证：文件存在，六类内容均可检索到。
- [x] 1.2 在 `docs/AGENTS.md` 权威表加入"包元数据与版本策略 → `docs/package-metadata.md`"一行；如超过 25 行则压缩一条现有规则。验证：行数 ≤25、非空白字符 ≤1,000、链接目标存在。
- [x] 1.3 更新根 `AGENTS.md` 的 catalog 安装示例和 TypeScript 固定口径，指向 `catalog:toolchain` / `catalog:dev` / `catalog:runtime`。验证：根文件 ≤70 行且 ≤3,200 非空白字符，三个 catalog 名称可检索到。

## 2. Manifest 元数据

- [x] 2.1 将根 `description` 替换为具体一句话：`Inkstack — an AI design-to-code canvas with agent pen control, manual editing, and deterministic code generation.` 验证：字段值与目标字符串一致。
- [x] 2.2 为 `apps/bff`、`apps/canvas`、`apps/gateway`、`apps/shell`、`packages/config`、`packages/contracts` 补充英文 `description`。验证：每个描述非空、40–120 字符、不等于包名。
- [x] 2.3 为上述 6 个包补充 `"license": "ISC"`。验证：6 个 manifest 均可检索到该字段。
- [x] 2.4 确认 `type` 只保留已有决定：根 `module`、`packages/contracts` `commonjs`；apps 与 config 不新增 `type`。验证：`grep` 结果与策略一致。
- [x] 2.5 确认 `packages/config` 除 `description` / `license` 外未改动 `exports`、`files`、`scripts`。验证：`git diff -- packages/config/package.json` 只包含这两个字段。

## 3. Catalog 拆分

- [x] 3.1 将 `pnpm-workspace.yaml` 拆为 `toolchain`（`typescript: 6.0.3`、`@fission-ai/openspec: 1.14.3`）、`dev`（turbo、commitlint、config-conventional、husky、`@types/node`、yaml）、`runtime`（空占位）。验证：YAML 可解析，`toolchain` 全部为精确版本。
- [x] 3.2 将根 `package.json` 中 `typescript`、`@fission-ai/openspec` 改为 `catalog:toolchain`；`@types/node`、turbo、commitlint、config-conventional、husky 保持 `catalog:dev`；新增 `yaml` 为 `catalog:dev`。验证：根 devDependencies 中没有裸 semver，也没有指向不存在 catalog 的引用。
- [x] 3.3 运行 `pnpm install`，确认 lockfile 更新且安装版本正确。验证：`node -p` 读取 `typescript` 为 `6.0.3`、`pnpm exec openspec --version` 为 `1.14.3`、`yaml` 可被脚本导入。

## 4. Manifest 检查脚本

- [x] 4.1 创建 `scripts/check-manifests.mjs`，实现名称、private、description、license、依赖说明符、toolchain 精确 pin、引擎一致性、scripts、版本 warning 九类规则。验证：脚本存在且 `node --check scripts/check-manifests.mjs` 通过。
- [x] 4.2 在根 `package.json` 增加 `"check:manifests": "node scripts/check-manifests.mjs"`。验证：`pnpm check:manifests` 可执行并退出 0；输出包含检查的 manifest 数量。
- [x] 4.3 用一个临时副本验证失败路径：复制根 manifest 到临时目录，故意写入长描述或裸 semver，确认脚本报错且退出码非 0，然后删除临时目录。验证：临时目录不存在，失败用例被记录在任务说明中。失败用例：`turbo: "^2.11.9"` 与 `apps/bff` 的 5 字符描述均被拒绝，退出码 1。

## 5. 集成验证

- [x] 5.1 运行 `pnpm typecheck` 和 `pnpm build`，记录实际输出；只有 `@inkstack/contracts` 配置脚本时记录为 1 个成功任务。
- [x] 5.2 运行 `openspec validate manifest-hygiene`，确认变更校验通过。
- [x] 5.3 复核文档预算与链接：根 `AGENTS.md` ≤70 行且 ≤3,200 非空白字符；`docs/AGENTS.md` ≤25 行且 ≤1,000；所有相对链接目标存在。
- [x] 5.4 复核范围：没有修改 tsconfig / lint / format 配置，没有改变包版本，没有引入 Changesets / publishConfig / CI / OpenWiki。验证：`git status` 与 `git diff --stat` 只包含本变更声明的文件。

## Workflow follow-up

- 由用户检查工作区改动并自行提交；本项目规则不允许 Agent 自行 `git add` / `commit` / `push`。
- 评审通过后运行 `/opsx:archive` 归档该变更。
