# repository-hygiene Specification

## Purpose

在骨架阶段持续发现死代码、未使用依赖、未声明依赖与无效包导出，避免仓库随着包和依赖增加而积累无人维护的内容。

## Requirements

### Requirement: 未使用代码与依赖必须被报告

仓库 SHALL 提供一条全仓库检查命令，报告无人引用的文件、导出与类型、未使用或未声明的依赖，以及未被任何包引用的 catalog 条目；存在任一问题时 MUST 以非零状态退出。

#### Scenario: 干净仓库

- **WHEN** 仓库中不存在死文件、死导出、未使用依赖或未声明依赖
- **THEN** 检查命令成功退出，且不输出问题列表

#### Scenario: 新增死文件

- **WHEN** 新增一个没有任何模块引用的源文件
- **THEN** 检查命令失败，并指出该文件的路径

#### Scenario: 新增死导出

- **WHEN** 某个模块导出了无人使用的值或类型
- **THEN** 检查命令失败，并指出所在文件与符号名

#### Scenario: 未声明依赖

- **WHEN** 配置文件或源码引用了一个未在 `package.json` 中声明的包
- **THEN** 检查命令失败，并指出引用位置与缺失的包名

### Requirement: 库包导出映射必须可解析

声明了 `exports` 的包 SHALL 在其发布文件集内验证每个导出目标存在且可解析；目标缺失或条件结构非法时 MUST 失败。

#### Scenario: 合法导出

- **WHEN** 包的 `exports` 全部指向实际存在的构建产物
- **THEN** 导出检查通过

#### Scenario: 目标缺失

- **WHEN** 某个 `exports` 目标指向不存在的文件
- **THEN** 导出检查失败，并指出包名与目标路径

#### Scenario: 多子路径导出

- **WHEN** 包同时提供多个子路径导出
- **THEN** 每个子路径都被独立验证，而不是只检查根导出

### Requirement: 导出检查基于构建产物

导出检查 SHALL 在包构建完成后运行；在干净检出中 MUST 先构建再检查，MUST NOT 依赖工作区里已有的 `dist`。

#### Scenario: 干净检出

- **WHEN** 工作区没有 `dist` 目录
- **THEN** 检查先执行构建，再基于新产物完成导出检查

#### Scenario: 构建失败

- **WHEN** 包的构建失败
- **THEN** 导出检查不继续执行，整个检查命令失败

### Requirement: 抑制必须最小且有理由

检查配置中的每一条忽略 SHALL 限定到具体路径、包或依赖，并 MUST 记录理由；MUST NOT 用宽泛忽略关闭整类检查。

#### Scenario: vendored 目录

- **WHEN** 目录内容来自第三方技能或上游副本，不属于仓库代码
- **THEN** 只忽略该目录，并在配置中写明原因

#### Scenario: 仅由 CLI 调用的依赖

- **WHEN** 某个依赖只由命令行工具或工作流调用，源码不会 import
- **THEN** 只忽略该依赖，并在配置中写明调用方

### Requirement: 推送前执行检查

pre-push SHALL 执行 `pnpm verify`，依次覆盖 install、lint、manifest、typecheck、test、build、format 与 hygiene；任一检查失败 MUST 阻止推送。

#### Scenario: 检查通过

- **WHEN** 所有检查（包括测试）都通过
- **THEN** 推送继续执行

#### Scenario: 检查失败

- **WHEN** 任一检查失败，包括测试失败或 hygiene 发现死代码、依赖与导出问题
- **THEN** 推送被阻止，并输出需要修复的问题

### Requirement: 有运行时逻辑的包必须提供测试

`packages/*` 中导出运行时行为的包 SHALL 提供 `test` script、`vitest: catalog:dev` devDependency 与至少一个 `test/**/*.test.ts`；纯类型包 MUST 在清单检查中登记豁免与理由；违反时 `pnpm check:manifests` MUST 失败。

#### Scenario: 运行时包合规

- **WHEN** 一个导出运行时行为的包具备 test script、vitest 依赖与测试文件
- **THEN** 清单检查通过

#### Scenario: 缺少测试

- **WHEN** 一个导出运行时行为的包没有测试文件或 test script
- **THEN** 清单检查失败，并指出包路径与缺失项

#### Scenario: 纯类型包豁免

- **WHEN** 包只导出类型且已登记在豁免列表并写明理由
- **THEN** 不要求测试脚本与测试文件
