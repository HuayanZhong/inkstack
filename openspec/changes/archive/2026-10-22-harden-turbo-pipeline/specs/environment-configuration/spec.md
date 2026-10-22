# Spec Delta

## ADDED Requirements

### Requirement: 测试环境配置不依赖 env 文件

测试 MUST NOT 依赖 `.env` 文件；测试所需配置 SHALL 由测试内 stub、显式传参或测试替身提供。仓库模板与规则 MUST NOT 声称测试会加载 `.env.test`，MUST NOT 把 `.env.test` 作为测试配置的必需来源。

#### Scenario: 无 env 文件运行测试

- **WHEN** 工作区不存在任何 `.env*` 文件，执行 `pnpm test` 或 `pnpm test:coverage`
- **THEN** 测试仍能完成，不因缺少 env 文件而失败

#### Scenario: 测试提供配置

- **WHEN** 某个测试需要端口、URL 或开关值
- **THEN** 测试通过 `vi.stubEnv`、显式参数或测试替身提供值，而不是读取 `.env` 文件

#### Scenario: 存在 .env.test

- **WHEN** 工作区存在 `.env.test`
- **THEN** 测试结果与不存在该文件时一致，不隐式依赖其内容

#### Scenario: 模板与规则一致

- **WHEN** 开发者阅读 `.env.example` 或 `.claude/rules/env.md`
- **THEN** 文档只说明 dev 与 build 的 env 加载链，不承诺测试加载 `.env.test`
