---
paths:
  - '**/env.ts'
  - '**/config/**'
  - '**/turbo.json'
  - '**/next.config.ts'
  - '**/.env*'
---

# 环境变量分发

环境相关配置只从 env 读取；源码、配置文件与脚本里不写死端口、host、URL、origin 或凭据。

## 什么必须进 env

- 端口、host、URL、origin、公开路径。
- 随环境变化的开关、超时、连接串与凭据。
- 例外：schema 中的默认值；颜色、文案、布局等纯 UI 常量。

## 命名与边界

- Next 应用端口用 `PORT`，Next CLI 原生读取该变量。
- 其他应用用 `<APP>_PORT`，例如 `BFF_PORT`、`CANVAS_PORT`、`GATEWAY_PORT`。
- 客户端可见变量必须用 `NEXT_PUBLIC_` 前缀；服务端密钥禁止使用该前缀。
- 跨应用地址显式配置（如 `NEXT_PUBLIC_CANVAS_MF_ENTRY`），不从另一个应用的端口推导。

## 四个 home

新增或修改变量时同步：

1. `.env.example`：模板、注释与默认值。
2. `turbo.json`：`globalEnv` 或任务 `env`；`build.inputs` 包含 `$TURBO_ROOT$/.env*`。
3. 应用 `config/env.ts`：zod schema、默认值与类型。
4. 源码：只从解析后的 `env` / `config` 读取。

## 加载与校验

- 应用 scripts 用 `dotenv-cli` 按 `.env.local → .env.<mode> → .env` 加载；应用代码不自行读取 `.env` 文件。
- 测试使用 `.env.test`，不参与 dev / prod 链。
- 启动或构建时用 `@inkstack/config` 的 `parseEnv` 校验，缺失或非法直接失败。
- typecheck 允许把 `.env.example` 作为最后的非密钥兜底；build / dev 不允许。
- 默认值只写进 schema；真实密钥只写 `.env.local` 或部署环境。

## 验证

改完后跑 `pnpm typecheck`、`pnpm build`，并用检索确认源码中不再出现该硬编码值。
