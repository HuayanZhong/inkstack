# Spec Delta

## REMOVED Requirements

### Requirement: 远程入口可配置

**Reason**: 该变量已改为必填，未配置时不再回退到 `http://localhost:4002/mf-manifest.json`。

**Migration**: 在 `.env`、`.env.local` 或部署环境中显式设置 `NEXT_PUBLIC_CANVAS_MF_ENTRY`；只有此前依赖内置默认值的环境需要补配置。

## ADDED Requirements

### Requirement: 远程入口必须显式配置

shell SHALL 从 `NEXT_PUBLIC_CANVAS_MF_ENTRY` 读取 canvas 的远程入口；该变量 MUST 是合法 URL，并在 dev / build 启动时校验；缺失或非法时 MUST 终止启动，MUST NOT 回退到内置地址。

#### Scenario: 使用环境变量

- **WHEN** `NEXT_PUBLIC_CANVAS_MF_ENTRY` 指向有效的 manifest 地址
- **THEN** shell 从该地址加载 canvas

#### Scenario: 未配置时启动失败

- **WHEN** 未设置 `NEXT_PUBLIC_CANVAS_MF_ENTRY`，执行 shell 的 dev 或 production 构建
- **THEN** 启动终止
- **AND** 错误信息包含变量名与失败原因

#### Scenario: 非法 URL

- **WHEN** `NEXT_PUBLIC_CANVAS_MF_ENTRY` 不是合法 URL
- **THEN** 启动终止，而不是带着不可用地址继续
