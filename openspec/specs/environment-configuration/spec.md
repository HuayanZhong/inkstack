# environment-configuration Specification

## Purpose

定义共享配置解析约定，以及服务在启动时校验环境变量、向业务代码暴露类型化配置的行为，使缺失或非法的配置在启动阶段暴露，而不是留到运行期。

## Requirements

### Requirement: 环境校验在启动前完成

BFF SHALL 在开始监听端口前解析并校验环境变量；任一必填项缺失或类型非法时 MUST 终止启动，并报告所有失败字段的路径与原因，MUST NOT 以部分配置继续运行。

#### Scenario: 合法配置正常启动

- **WHEN** 所有必填环境变量存在且类型正确
- **THEN** BFF 完成校验并开始监听端口

#### Scenario: 单个字段非法

- **WHEN** `BFF_PORT` 不是正整数
- **THEN** BFF 启动失败
- **AND** 错误信息包含 `BFF_PORT` 及失败原因

#### Scenario: 多个字段非法

- **WHEN** 启动环境中同时存在多个缺失或非法字段
- **THEN** 错误信息一次性列出全部字段，而不是只报第一个

### Requirement: BFF 监听端口由 BFF_PORT 决定

BFF SHALL 使用 `BFF_PORT` 作为监听端口；未设置时 MUST 使用 `4003`；该值 MUST 是正整数。

#### Scenario: 显式指定端口

- **WHEN** `BFF_PORT=4100`
- **THEN** BFF 监听 `4100`

#### Scenario: 未设置端口

- **WHEN** 环境中没有 `BFF_PORT`
- **THEN** BFF 监听 `4003`

### Requirement: 业务代码通过类型化配置读取

BFF 业务代码 SHALL 通过启动时生成的类型化配置对象读取配置；除配置模块外，业务代码 MUST NOT 直接读取 `process.env`。

#### Scenario: 业务模块获取端口

- **WHEN** 业务模块需要监听端口或运行时环境信息
- **THEN** 它从配置对象读取，且具备对应的 TypeScript 类型
- **AND** 该模块不出现 `process.env`

### Requirement: 解析器语义固定

共享解析器 SHALL 对非空字符串、URL、正整数与布尔值采用固定语义；布尔值 MUST 只接受 `true`、`false`、`1`、`0`，其他字面量 MUST 校验失败。

#### Scenario: 布尔值解析

- **WHEN** 环境变量值为 `false` 或 `0`
- **THEN** 解析结果为布尔 `false`

#### Scenario: 非法布尔值

- **WHEN** 环境变量值为 `yes` 或空字符串
- **THEN** 校验失败，而不是被当作 `true`
