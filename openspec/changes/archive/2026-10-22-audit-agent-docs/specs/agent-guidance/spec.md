# Spec Delta

## Purpose

约束仓库内 agent 指引文件的可加载性、单一归属、预算与事实准确性，并通过统一命令在本地与 CI 校验，防止指引随仓库增长而失真。

## ADDED Requirements

### Requirement: Agent 指引文件必须可加载

每个拥有 `AGENTS.md` 的非根目录 SHALL 同时提供只包含 `@AGENTS.md` 的 `CLAUDE.md`；根 `CLAUDE.md` SHALL 导入根 `AGENTS.md`。缺少桥接文件或桥接文件包含其他内容时，文档检查 MUST 失败。

#### Scenario: 缺少桥接文件

- **WHEN** 某个非根目录存在 `AGENTS.md` 但没有 `CLAUDE.md`
- **THEN** 文档检查失败，并指出缺失桥接文件的目录

#### Scenario: 桥接文件内容不纯

- **WHEN** 非根目录的 `CLAUDE.md` 除 `@AGENTS.md` 外还包含其他内容
- **THEN** 文档检查失败，并指出该文件

#### Scenario: 全部可加载

- **WHEN** 每个含 `AGENTS.md` 的目录都有符合约定的桥接文件
- **THEN** 文档检查通过

### Requirement: 手写区预算必须可校验

根 `AGENTS.md` 的手写区 SHALL 不超过 70 行与 3,200 个非空白字符；其他层 `AGENTS.md` SHALL 不超过 25 行与 1,000 个非空白字符。由工具维护的标记块 MUST NOT 计入预算；超限时文档检查 MUST 失败。

#### Scenario: 根文件超限

- **WHEN** 根 `AGENTS.md` 的手写区超过 3,200 个非空白字符
- **THEN** 文档检查失败，并报告当前字数与预算

#### Scenario: 标记块变长

- **WHEN** 工具维护的标记块使文件总长度超出预算，但手写区仍在预算内
- **THEN** 文档检查通过

#### Scenario: 子树超限

- **WHEN** 某个子树 `AGENTS.md` 的手写区超过 1,000 个非空白字符
- **THEN** 文档检查失败，并指出该文件

### Requirement: 指引中的事实必须与仓库一致

指引引用的命令 SHALL 存在于对应 `package.json`，引用的相对路径 SHALL 存在，声明的版本 SHALL 与 catalog、`.nvmrc` 或 `packageManager` 一致。任一不一致时文档检查 MUST 失败并指出文件与条目。

#### Scenario: 引用不存在的命令

- **WHEN** 指引写出的 `pnpm` script 在对应 `package.json` 中不存在
- **THEN** 文档检查失败，并指出文件、命令与所在包

#### Scenario: 引用不存在的路径

- **WHEN** 指引中的相对链接或文件路径指向不存在的目标
- **THEN** 文档检查失败，并指出文件与失效路径

#### Scenario: 版本文档漂移

- **WHEN** 指引声明的 Node、pnpm 或 TypeScript 版本与仓库固定值不一致
- **THEN** 文档检查失败，并报告两侧的值

### Requirement: 同一事实不得存在冲突表述

同一操作或事实在仓库指引中 SHALL 只有一个可执行表述；出现互斥的命令、目录或完成标准时，文档检查 MUST 失败。判定至少覆盖完成门禁、shadcn 生成方式、端口与工具链版本。

#### Scenario: shadcn 执行目录冲突

- **WHEN** 两处指引分别要求从仓库根与从应用目录执行 shadcn 命令
- **THEN** 文档检查失败，并列出两处位置

#### Scenario: 完成门禁冲突

- **WHEN** 一处要求 `pnpm typecheck`、另一处要求 `pnpm verify` 作为完成标准
- **THEN** 文档检查失败，并指出冲突条目

### Requirement: 重复的规范子句必须被报告

同一规范子句出现在多个当前指引文件中时，文档检查 SHALL 输出 warning 并成功退出；指向权威文件的链接式复述 MUST NOT 被视为重复。告警 MUST 列出涉及的文件。

#### Scenario: 规范子句重复

- **WHEN** 同一条 catalog 约束在两个当前 `AGENTS.md` 中重复出现
- **THEN** 文档检查输出 warning，列出两个文件，并以零状态退出

#### Scenario: 链接式复述

- **WHEN** 子树只写“见 `docs/package-metadata.md`”而不复述规则
- **THEN** 不产生重复告警

### Requirement: 文档检查必须进入统一门禁

仓库 SHALL 提供 `pnpm check:docs`，并在 `pnpm verify` 与 CI static 中执行；文档检查失败时 `pnpm verify` MUST 以非零状态退出。

#### Scenario: verify 阻断

- **WHEN** 文档检查发现结构或事实错误
- **THEN** `pnpm verify` 以非零状态退出，并输出问题列表

#### Scenario: CI 阻断

- **WHEN** PR 触发 static 检查且文档检查失败
- **THEN** CI static 失败，PR 不能通过门禁
