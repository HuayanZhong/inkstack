# Spec Delta

## MODIFIED Requirements

### Requirement: 推送前执行检查

pre-push SHALL 执行 `pnpm verify`，依次覆盖 install、lint、manifest、typecheck、test、build、format 与 hygiene；任一检查失败 MUST 阻止推送。

#### Scenario: 检查通过

- **WHEN** 所有检查（包括测试）都通过
- **THEN** 推送继续执行

#### Scenario: 检查失败

- **WHEN** 任一检查失败，包括测试失败或 hygiene 发现死代码、依赖与导出问题
- **THEN** 推送被阻止，并输出需要修复的问题

## ADDED Requirements

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
