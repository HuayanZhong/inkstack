# Spec Delta

## Purpose

约束 README 与仓库结构、引用和章节的一致性，通过统一的文档检查在本地与 CI 发现文档漂移，避免 README 索引、命令和状态随包增长而失真。

## ADDED Requirements

### Requirement: README 索引必须与 workspace 一致

根 README 的 `apps/`、`packages/` 目录树与 `packages/README.md` 的包索引 SHALL 覆盖每个含 `package.json` 的 `apps/*` 与 `packages/*`，且 MUST NOT 列出不存在的条目。缺失或多列时文档检查 MUST 失败并指出具体条目。

#### Scenario: 索引漏列包

- **WHEN** 某个含 `package.json` 的 workspace 包没有出现在根 README 目录树或 `packages/README.md` 索引中
- **THEN** 文档检查失败，并指出缺失的包名与所在索引文件

#### Scenario: 索引多列包

- **WHEN** README 索引列出了一个不存在或没有 `package.json` 的目录
- **THEN** 文档检查失败，并指出多余条目

#### Scenario: 索引完全一致

- **WHEN** 两个索引与真实 workspace 包双向一致
- **THEN** 文档检查通过

### Requirement: README 标题必须匹配包名

`apps/*` 与 `packages/*` 的 README H1 SHALL 等于对应 `package.json` 的 `name`；根 README、`packages/README.md` 与 `docs/**/README.md` 作为索引或专题文档不受此规则约束。

#### Scenario: 包名漂移

- **WHEN** 包 README 的 H1 与 `package.json` 的 `name` 不一致
- **THEN** 文档检查失败，并同时报告两个值

#### Scenario: 标题匹配

- **WHEN** 包与应用 README 的 H1 使用对应包名
- **THEN** 文档检查通过

### Requirement: README 必备章节必须完整

包 README SHALL 包含命令章节（包声明了任何 script 时）与至少一个使用或消费章节；应用 README SHALL 包含运行与相关文档章节。缺少适用章节时文档检查 MUST 失败并指出文件与缺失章节。

#### Scenario: 包 README 缺少命令章节

- **WHEN** 一个声明了 `scripts` 的包，其 README 没有任何命令章节
- **THEN** 文档检查失败，并指出该包 README

#### Scenario: 应用 README 缺少运行章节

- **WHEN** `apps/*` 的 README 没有运行章节
- **THEN** 文档检查失败，并指出该应用 README

#### Scenario: 必备章节齐全

- **WHEN** 所有包与应用 README 都包含各自适用的章节
- **THEN** 文档检查通过

### Requirement: README 不得包含空章节或占位内容

README 的章节 MUST 有实际内容；出现空章节、`TODO`、`TBD` 或等价占位句时文档检查 MUST 失败。

#### Scenario: 空章节

- **WHEN** README 中某个 H2 标题下没有任何正文或列表
- **THEN** 文档检查失败，并指出文件与标题

#### Scenario: 占位句

- **WHEN** README 正文包含 `TODO` 或 `TBD` 占位
- **THEN** 文档检查失败，并指出文件与行号

### Requirement: README 引用必须可解析

README 中的相对链接、反引号项目路径、`pnpm --filter @inkstack/<pkg> <script>`、声明的端口和包导出子路径 MUST 可解析或存在于对应事实源；生成目录与尚未创建的未来文件不参与路径检查。任一失效时文档检查 MUST 失败。

#### Scenario: 失效相对链接

- **WHEN** README 的相对链接指向不存在的文件或目录
- **THEN** 文档检查失败，并指出文件与链接目标

#### Scenario: 失效包命令

- **WHEN** README 写出的 `pnpm --filter @inkstack/<pkg> <script>` 在对应 `package.json` 中不存在
- **THEN** 文档检查失败，并指出包名与脚本名

#### Scenario: 端口漂移

- **WHEN** README 声明的 `*_PORT` 默认值与 `.env.example` 不一致
- **THEN** 文档检查失败，并报告两侧的值

#### Scenario: 导出子路径缺失

- **WHEN** README 明确写出某个包导出子路径，但 `package.json` 的 `exports` 没有对应条目
- **THEN** 文档检查失败，并指出包名与子路径

### Requirement: README 检查必须进入统一门禁

`pnpm check:docs` SHALL 同时检查 README 与 `AGENTS.md`；README 检查失败时 MUST 以非零状态退出，并由 `pnpm verify` 与 CI static 阻断合并。

#### Scenario: 本地门禁

- **WHEN** 本地执行 `pnpm verify` 且 README 索引或引用失效
- **THEN** 命令以非零状态退出，并输出问题列表

#### Scenario: CI 门禁

- **WHEN** PR 触发 static 检查且 README 检查失败
- **THEN** CI static 失败，`all checks passed` 不通过

### Requirement: README 检查规则必须有自测

新增或修改的 README 检查规则 SHALL 有 fixture 自测，覆盖至少一个失败用例与一个通过用例；自测 MUST 随 `pnpm check:docs` 一起执行并在失败时以非零状态退出。

#### Scenario: 规则缺少自测

- **WHEN** 新增一条 README 规则但没有对应的 fixture 用例
- **THEN** 自测无法覆盖该规则，变更不得合并

#### Scenario: 自测覆盖漏项

- **WHEN** fixture 中的索引故意漏掉一个包
- **THEN** 自测断言检查器报告该缺失并失败

#### Scenario: 自测全部通过

- **WHEN** 所有 fixture 的期望结果与实际结果一致
- **THEN** 自测以零状态退出
