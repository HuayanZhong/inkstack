# Spec Delta

## MODIFIED Requirements

### Requirement: 推送前执行检查

pre-push SHALL 执行 `pnpm verify`，依次覆盖 install、lint、manifest、agent 文档、typecheck、test、build、format 与 hygiene；任一检查失败 MUST 阻止推送。

#### Scenario: 检查通过

- **WHEN** 所有检查（包括测试与文档检查）都通过
- **THEN** 推送继续执行

#### Scenario: 检查失败

- **WHEN** 任一检查失败，包括测试失败、文档检查失败，或 hygiene 发现死代码、依赖与导出问题
- **THEN** 推送被阻止，并输出需要修复的问题
