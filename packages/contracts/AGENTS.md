# AGENTS.md

补充根文件的规则。本目录是唯一的跨进程契约包，当前只导出 `ActionId`。

## 职责

- 定义画布 action 协议、信封、ack、BFF DTO、design 文档元数据与 codegen IR。
- 只收跨 HTTP / WS / SSE / 序列化边界的类型；进程内类型留在拥有它的包。
- 不放 Gateway / Canvas 的运行时实现。

## 约束

- 零运行时依赖：不 import React、Node 内置、zod、ky、tldraw，也不 re-export 第三方类型。
- 公共导出使用 TSDoc，注明协议语义、不变量与兼容性约束。
- 只增不改：新增可选字段或新类型名，破坏性变更不复用旧名。
- 引入运行时值（如 zod schema）时，同步补测试并从测试豁免中移除。

## 目录

- `src/index.ts`：唯一公共入口，只做类型再导出。
- 按域拆文件；没有真实类型时不建空文件：

```text
src/action.ts   action / ack / WS 事件
src/api.ts      BFF REST / SSE DTO
src/design.ts   design.json 元数据
src/ir.ts       codegen IR
```
