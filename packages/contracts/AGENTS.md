# AGENTS.md

补充根文件的规则。本目录是共享协议包，当前只导出 `ActionId`。

## 职责

- 定义画布 action 协议、信封、ack 与 codegen IR。
- 只放可序列化的类型与协议，不放 Gateway / Canvas 的运行时实现。

## 约束

- 公共导出使用 TSDoc，注明协议语义与兼容性约束。
- 新增类型优先复用已有 action 命名，不引入第二套 envelope。
- 依赖只通过 catalog 引用；构建到 `dist`，消费方用 `workspace:*`。
- 当前没有协议实现，不要在包里补队列、持久化或执行器逻辑。

## 目录

- `src/index.ts`：当前唯一入口。
