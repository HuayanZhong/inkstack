# Tasks

## 1. 固化 contracts 的准入规则

- [x] 1.1 更新 `packages/contracts/AGENTS.md`，写入跨进程契约的准入与排除规则、零运行时依赖、不 re-export 第三方类型、只增不改、运行时值退出纯类型豁免；验证 `pnpm check:docs` 通过，且该文件仍满足子树预算（≤25 非空行、≤1,000 非空白字符）。
- [x] 1.2 更新 `packages/contracts/README.md`，增加“边界”章节：放什么、不放什么、何时按运行时边界拆分、何时引入运行时校验；验证文档中的四类判断都能对应到具体类型示例。
- [x] 1.3 更新 `packages/AGENTS.md` 的包边界，增加“跨进程契约只走 contracts、不新增通用 types 包”一条；验证 `pnpm check:docs` 通过，且未重复 contracts README 的完整规则。

## 2. 验证文档一致性

- [x] 2.1 运行 `pnpm check:docs` 与 `pnpm check:manifests`，确认 AGENTS 预算、交叉引用与包元数据检查全部通过。
- [x] 2.2 运行 `pnpm verify` 并报告实际输出，确认仅有文档改动时门禁仍通过。

## Workflow follow-up

- 实现完成后归档本变更。
