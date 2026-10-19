# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: BFF 监听端口由 BFF_PORT 决定

**Reason**: 端口规则需要覆盖 shell、canvas、gateway，单个 BFF 专属需求无法表达统一的命名与默认值。

**Migration**: 行为不变；按新增的「监听端口由应用专属变量决定」执行。

## ADDED Requirements

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
