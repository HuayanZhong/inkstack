# Spec Delta

## ADDED Requirements

### Requirement: lint 必须覆盖根目录脚本与配置

`pnpm lint` SHALL 使用主规则检查仓库根目录的 JS/TS 脚本与配置，至少覆盖 `scripts/**/*.mjs`、`knip.config.ts` 与 `commitlint.config.mjs`；MUST NOT 只依赖包级 turbo lint 与 Turbo env 规则。

#### Scenario: 根目录脚本违规

- **WHEN** `scripts/` 下的脚本出现主规则禁止的写法
- **THEN** `pnpm lint` 失败，并指出违规文件与规则

#### Scenario: 根目录配置合规

- **WHEN** 根目录脚本与配置全部符合主规则
- **THEN** `pnpm lint` 成功退出，且不重复报告包内已检查的文件

#### Scenario: 包级 lint 不受影响

- **WHEN** 执行 `pnpm lint`
- **THEN** 各包的 lint 仍按原有配置与 type-aware 设置运行

## MODIFIED Requirements

### Requirement: 推送前执行检查

pre-push SHALL 执行 `pnpm verify`，依次覆盖 install、lint、manifest、agent 文档、typecheck、test:coverage、build、format 与 hygiene；任一检查失败或覆盖率未达门槛 MUST 阻止推送。

#### Scenario: 检查通过

- **WHEN** 所有检查（包括测试与文档检查）都通过
- **THEN** 推送继续执行

#### Scenario: 检查失败

- **WHEN** 任一检查失败，包括测试失败、文档检查失败、覆盖率不足，或 hygiene 发现死代码、依赖与导出问题
- **THEN** 推送被阻止，并输出需要修复的问题

#### Scenario: 覆盖率不足

- **WHEN** 任一包的 statements 或 lines 低于 80%，或 branches 或 functions 低于 70%
- **THEN** `pnpm test:coverage` 失败，pre-push 阻止推送
