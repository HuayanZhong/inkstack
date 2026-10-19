# Spec Delta

## MODIFIED Requirements

### Requirement: 资源地址按环境区分

canvas 的 publicPath SHALL 在 dev 由 `CANVAS_HOST` 与 `CANVAS_PORT` 组成完整地址，在 production 使用部署时自动解析的地址；production 产物 MUST NOT 写入 localhost 地址。

#### Scenario: dev 使用配置的 host 与端口

- **WHEN** `CANVAS_HOST=192.168.1.10` 且 `CANVAS_PORT=4100`，canvas 以 dev 模式启动
- **THEN** dev 资源地址为 `http://192.168.1.10:4100/`
- **AND** `mf-manifest.json` 指向同一地址

#### Scenario: 未配置开发地址

- **WHEN** 未设置 `CANVAS_HOST` 与 `CANVAS_PORT`
- **THEN** dev 资源地址回退为 `http://localhost:4002/`

#### Scenario: 生产清单不包含 localhost

- **WHEN** 检查 production 构建生成的 `mf-manifest.json`
- **THEN** 其中远程资源地址不包含 `localhost`
- **AND** 资源按部署源解析
