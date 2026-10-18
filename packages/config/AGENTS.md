# AGENTS.md

补充根文件的规则。本目录是共享配置包，供各应用在启动时解析与校验环境变量。

## 职责

- 提供环境变量解析器、`parseEnv` 与 `EnvError`。
- 提供 URL 与路由前缀标准化工具。
- 只解析与校验，不加载 `.env` 文件；加载由各应用的启动方式负责。

## 目录

- `src/env.ts`：解析器、schema 工厂与错误类型。
- `src/normalize.ts`：URL 与前缀标准化。
- `src/index.ts`：统一导出。

## 约束

- 每个应用的 schema 定义在使用方，不汇入本包。
- 布尔值只接受 `true` / `false` / `1` / `0`；禁止 `Boolean(value)` 语义。
- 公共导出使用 TSDoc；依赖只通过 catalog 引用。
