# @inkstack/contracts

墨栈唯一的跨进程契约包：定义画布 action、ack、BFF DTO、design 文档元数据与 codegen IR。

当前只有 `ActionId` 一个导出；后续契约随对应变更落地，不提前建空文件。

## 边界

判断标准：这个类型是否跨进程、需要序列化？是则进本包，否则留在拥有它的包。

| 类型                             | 归属                   |
| -------------------------------- | ---------------------- |
| action / ack / WS 事件           | `@inkstack/contracts`  |
| BFF REST / SSE DTO               | `@inkstack/contracts`  |
| design.json 元数据               | `@inkstack/contracts`  |
| codegen IR                       | `@inkstack/contracts`  |
| `ApiClientConfig`、`EventStream` | `@inkstack/api-client` |
| env schema 推导类型              | `@inkstack/config`     |
| 组件 props                       | `@inkstack/ui`         |
| 应用内部状态                     | 各 `apps/*`            |

不放进本包的内容：

- 进程内类型，例如请求器配置、React props、Nest 装饰器类型。
- 第三方类型的再导出。tldraw、React、Nest 的类型由消费者直接导入；本包只定义自己的结构，必要时用最小结构化接口描述边界。
- 运行时实现、队列、持久化与执行器逻辑。

## 目录设计

本包是 pnpm workspace 中的普通库包，依赖方向只有 `apps/* -> contracts`；contracts 不依赖任何应用或运行时包。

```text
packages/contracts/
├── src/
│   ├── index.ts   唯一公共入口，只做类型再导出
│   ├── action.ts  action / ack / WS 事件
│   ├── api.ts     BFF REST / SSE DTO
│   ├── design.ts  design.json 元数据
│   └── ir.ts      codegen IR
├── package.json
└── tsconfig.json
```

- 文件按域拆，入口只做 `export type`，不写实现。
- 域文件在第一个真实类型出现时创建；空占位文件会被 knip 判为死代码，也会让 `dist` 出现无意义产物。
- 默认只用根导出，不急着加子路径。类型导入编译后会被擦除，子路径不带来运行时收益；等某个域需要独立审查或构建隔离时再拆 `exports`。

## 何时拆分

保持单包，直到出现以下信号：

- 两个域的消费者完全不相交，且包体积或审查成本成为问题。
- 某个域需要独立的构建节奏或版本策略。

拆分按运行时边界命名，例如 `@inkstack/api-contracts`、`@inkstack/design-schema`、`@inkstack/codegen-ir`；不建 `@inkstack/types` 这类无边界的通用包。

## 何时引入运行时校验

需要校验外部输入（MCP、外部 Agent、上传文件）时，在本包引入 zod schema，类型用 `z.infer` 推导。

这一步会让 contracts 从纯类型包变成运行时包：

- 增加 `test` 与 `test:coverage`，为 schema 补 Vitest 测试。
- 从 `scripts/check-manifests.mjs` 的 `testExemptions` 移除本包。
- 在此之前保持零运行时依赖。

## 命令

在仓库根执行：`pnpm --filter @inkstack/contracts build|typecheck|lint|publint`。

## 消费

应用通过 `"@inkstack/contracts": "workspace:*"` 引用，`main` / `types` 均指向构建后的 `dist`。不要跨包引用 `packages/contracts/src`。

## 约束

- 只放可序列化的类型与协议：interface、type、字面量联合；不放 class、函数或运行时枚举值。
- 时间与二进制字段用字符串描述（例如 ISO 8601），不使用 `Date`。
- 公共导出使用 TSDoc，协议语义、不变量与兼容性约束写在导出符号上。
- 只增不改：新增可选字段或新类型名；破坏性变更不复用旧名。
