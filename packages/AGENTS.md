# AGENTS.md

补充根文件的规则。本目录是共享包集合，包以 `workspace:*` 被 `apps/*` 消费。

## 文档三件套

- 每个 `packages/<name>/` MUST 同时包含 `AGENTS.md`、`CLAUDE.md`、`README.md`。
- `CLAUDE.md` 只写 `@AGENTS.md`。
- `README.md` 写包的职责、公开导出、构建命令与消费方式；导出或命令变化时同步更新。
- `AGENTS.md` 只写该包特有约束；通用的包元数据与 tsconfig 规则链接到 `docs/package-metadata.md`、`docs/typescript.md`。

## 包边界

- 包是库，不提供开发服务器；有 `src/` 的包构建到 `dist`。
- 应用通过 `@inkstack/*` + `workspace:*` 消费包，不跨包引用源码路径。
- 公共导出使用 TSDoc，协议语义与兼容性约束写在导出符号上。
- 有运行时代码的包 MUST 提供 Vitest 测试，并在同一变更里补齐；纯类型包按 [测试规则](../.claude/rules/testing.md) 登记豁免。

## 目录

- `config/`：配置解析与 URL 标准化。
- `contracts/`：action 协议、共享类型与 codegen IR。
- `tsconfig/`：共享 tsconfig 预设，无运行时代码。
- `vitest-config/`：共享 Vitest 预设（node / react / nest）。
