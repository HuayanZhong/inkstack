# environment-configuration Specification

## Purpose

定义共享配置解析约定，以及服务在启动时校验环境变量、向业务代码暴露类型化配置的行为，使缺失或非法的配置在启动阶段暴露，而不是留到运行期。

## Requirements

### Requirement: 环境校验在启动前完成

各应用 SHALL 在开始监听端口或产出构建前解析并校验环境变量；任一必填项缺失或类型非法时 MUST 终止启动，并报告所有失败字段的路径与原因，MUST NOT 以部分配置继续运行。

#### Scenario: 合法配置正常启动

- **WHEN** 所有必填环境变量存在且类型正确
- **THEN** 应用完成校验并开始监听端口或继续构建

#### Scenario: 单个字段非法

- **WHEN** `BFF_PORT` 不是正整数
- **THEN** BFF 启动失败
- **AND** 错误信息包含 `BFF_PORT` 及失败原因

#### Scenario: 多个字段非法

- **WHEN** 启动环境中同时存在多个缺失或非法字段
- **THEN** 错误信息一次性列出全部字段，而不是只报第一个

#### Scenario: 构建期应用校验失败

- **WHEN** `CANVAS_PORT` 不是正整数，执行 canvas 的 dev 或 production 构建
- **THEN** 构建终止并指出 `CANVAS_PORT`

### Requirement: 监听端口由应用专属变量决定

各应用 SHALL 使用各自的端口变量：shell 使用 `PORT`，canvas 使用 `CANVAS_PORT`，bff 使用 `BFF_PORT`，gateway 使用 `GATEWAY_PORT`；未设置时 MUST 分别使用 `3000`、`4002`、`4003`、`4001`，且值 MUST 是正整数。

#### Scenario: 显式指定端口

- **WHEN** `GATEWAY_PORT=4100`
- **THEN** gateway 监听 `4100`

#### Scenario: 未设置端口

- **WHEN** 环境中没有 `BFF_PORT`
- **THEN** BFF 监听 `4003`

#### Scenario: 非法端口

- **WHEN** `CANVAS_PORT` 为 `0` 或非数字
- **THEN** canvas 启动或构建失败，而不是回退到默认端口

### Requirement: 业务代码通过类型化配置读取

服务端业务代码 SHALL 通过启动时生成的类型化配置对象读取配置；除配置模块外，服务端业务代码 MUST NOT 直接读取 `process.env`。客户端代码读取 `NEXT_PUBLIC_*` 时 MUST 直接引用完整变量名，以便构建期内联；该例外 MUST NOT 用于服务端密钥。

#### Scenario: 业务模块获取端口

- **WHEN** 业务模块需要监听端口或运行时环境信息
- **THEN** 它从配置对象读取，且具备对应的 TypeScript 类型
- **AND** 该模块不出现 `process.env`

#### Scenario: 客户端读取公开变量

- **WHEN** 客户端组件需要读取 `NEXT_PUBLIC_CANVAS_MF_ENTRY`
- **THEN** 它直接引用 `process.env.NEXT_PUBLIC_CANVAS_MF_ENTRY`
- **AND** 服务端配置模块不被打包进客户端产物

### Requirement: 解析器语义固定

共享解析器 SHALL 对非空字符串、URL、正整数与布尔值采用固定语义；布尔值 MUST 只接受 `true`、`false`、`1`、`0`，其他字面量 MUST 校验失败。

#### Scenario: 布尔值解析

- **WHEN** 环境变量值为 `false` 或 `0`
- **THEN** 解析结果为布尔 `false`

#### Scenario: 非法布尔值

- **WHEN** 环境变量值为 `yes` 或空字符串
- **THEN** 校验失败，而不是被当作 `true`

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
