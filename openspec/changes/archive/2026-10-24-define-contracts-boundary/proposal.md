# Proposal

## Why

`@inkstack/contracts` 已被仓库文档指定为共享类型与协议的 home，但目前只有 `ActionId`，边界只写到“可序列化的类型与协议”，无法回答两个即将出现的问题：哪些类型该进 contracts，哪些必须留在 owner 包；类型变多时是否要新建 `@inkstack/types`。不先固定边界，action 协议、BFF DTO、design.json 落地时会出现重复定义，或者用一个无边界的 types 包吸走所有类型。

## What Changes

- 在 `packages/contracts/AGENTS.md` 固化 contracts 的准入规则：只收跨进程、可序列化的契约；零运行时依赖；不 re-export 第三方类型；只增不改；引入运行时值即退出纯类型豁免。
- 在 `packages/contracts/README.md` 增加“边界”章节：放什么、不放什么、何时拆分、何时引入运行时校验。
- 在 `packages/AGENTS.md` 的包边界增加一条：跨进程契约只走 contracts，不新增通用 types 包；需要拆分时按运行时边界命名。
- 不新增包、不改代码、不改构建配置。

## Capabilities

纯文档变更，不改变系统运行时行为，因此不在 `openspec/specs/` 新增或修改 capability；`openspec/changes/define-contracts-boundary/.openspec.yaml` 声明 `skip_specs: true`。

### New Capabilities

无。

### Modified Capabilities

无。

## Impact

- 受影响文件：`packages/contracts/AGENTS.md`、`packages/contracts/README.md`、`packages/AGENTS.md`。
- 不影响代码、依赖、构建产物、测试与运行时行为。
- 后续 action 协议、BFF DTO、design.json 与 codegen IR 的落点由这些规则约束。
