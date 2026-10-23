# Design

## Context

参见 `proposal.md` 的 Why。约束来自现有 monorepo：

- pnpm workspace 只包含 `apps/*` 与 `packages/*`，应用通过 `workspace:*` 消费包，不跨包引用源码。
- `@inkstack/contracts` 已是文档认定的共享类型与协议 home，当前只有 `ActionId`，且被登记为纯类型测试豁免。
- 包构建到 `dist`，声明文件由 `tsc` 生成；Turborepo 通过 `^build` 保证消费者在类型检查前拿到 `dist/*.d.ts`。
- 仓库用 knip 检查死代码与死导出，用 `check:manifests` 检查包元数据与测试豁免。

## Goals / Non-Goals

**Goals:**

- 固定跨进程契约的唯一归属，避免新增通用 `types` 包造成两个 home。
- 给出 contracts 在 monorepo 中的目录生长方式，后续 action、API DTO、design 文档与 IR 有确定的落点。
- 保持 contracts 零运行时依赖与纯类型状态，直到外部输入校验真正需要运行时值。

**Non-Goals:**

- 现在不新建任何包，也不创建空目录或空占位文件。
- 现在不引入子路径 `exports`、不引入 zod、不改构建配置。
- 不把进程内类型从 `api-client`、`config`、`ui` 上收到 contracts。

## Decisions

### 1. 单包承载，不新建 `@inkstack/types`

跨进程契约继续放在 `@inkstack/contracts`。通用 `types` 包会让 `api-client`、`config`、`ui` 的类型出现第二个 home：要么类型包反向依赖运行时包，要么所有包都挂到中心节点。

备选方案：

- `@inkstack/types` 收全部共享类型：拒绝，边界无法定义，且与 contracts 职责重叠。
- 现在就按域拆成多个包：拒绝，当前没有内容，拆分只会增加构建与文档成本。

### 2. 源码按域分文件，先用根导出

```
packages/contracts/src/
  index.ts    唯一公共入口，只做类型再导出
  action.ts   action / ack / WS 事件
  api.ts      BFF REST / SSE DTO
  design.ts   design.json 元数据
  ir.ts       codegen IR
```

暂不加子路径 `exports`。类型导入在编译后被擦除，子路径不带来运行时收益，却要为每个入口维护 `exports`、publint 与消费者解析。等某个域需要独立审查或构建隔离时再拆。

备选方案：一开始就用 `@inkstack/contracts/api` 等子路径。拒绝，当前消费者只有零星类型，子路径只会放大配置面。

### 3. 域文件按需创建，不建空占位

每个域文件在第一个真实类型出现时创建。空文件会被 knip 判为死代码，Git 也不跟踪空目录；提前铺结构会让 `dist` 出现无意义的空模块。

### 4. 依赖方向与内容约束

依赖方向只有 `apps/* -> contracts`；contracts 不依赖任何应用或运行时包。

- 零运行时依赖：不 import React、Node 内置、zod、ky、tldraw。
- 不 re-export 第三方类型：tldraw、React、Nest 的类型由消费者直接导入；边界处用最小结构化接口描述。
- 只放可序列化类型：interface、type、字面量联合；不放 class、函数或运行时枚举值。
- 只增不改：新增可选字段或新类型名，破坏性变更不复用旧名。

这样 contracts 不会成为传递运行时依赖的枢纽，也不会因为第三方版本升级被迫跟版。

### 5. 运行时校验是后续的显式转换

需要校验 MCP、外部 Agent 或上传文件时，在 contracts 引入 zod schema，类型用 `z.infer` 推导。届时 contracts 从纯类型包变成运行时包：补 `test` / `test:coverage`，并从 `scripts/check-manifests.mjs` 的 `testExemptions` 移除。这一步单独变更，不和类型边界混在一起。

### 6. 拆分按运行时边界命名

只有出现“两个域消费者完全不相交且构建/审查成本成为问题”或“某域需要独立版本策略”时才拆。拆分名按运行时 owner，例如 `@inkstack/api-contracts`、`@inkstack/design-schema`、`@inkstack/codegen-ir`；不按“类型/非类型”命名。

## Risks / Trade-offs

- [单包持续增长] → 拆分触发条件已写进 README；拆分时保留根导出做过渡，避免消费者一次性改 import。
- [边界只靠文档，没有自动检查] → 当前用评审与 `check:docs` 约束；如果边界反复被破坏，再给 `check-manifests` 增加“禁止 `packages/types`”的显式检查。
- [类型与运行时数据漂移] → 纯类型只保证编译期；出现外部输入时按决策 5 引入 schema，而不是继续手写类型。
- [根导出的桶文件变大] → `tsc` 仍按文件生成声明，入口只做再导出；真正影响审查时再评估子路径。
