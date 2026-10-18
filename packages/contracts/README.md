# @inkstack/contracts

墨栈的共享协议包，定义画布 action、ack 与 codegen IR。

当前只有 `ActionId` 一个导出；action 协议、信封与 IR 由后续变更补齐。

## 命令

在仓库根执行：`pnpm --filter @inkstack/contracts build|typecheck|lint`。

## 消费

应用通过 `"@inkstack/contracts": "workspace:*"` 引用，`main` / `types` 均指向构建后的 `dist`。

## 约束

- 只放可序列化的协议类型，不放运行时实现。
- 公共导出使用 TSDoc，协议语义与兼容性约束写在导出符号上。
