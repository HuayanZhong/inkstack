# 包元数据与版本策略

本文是 `package.json`、pnpm catalog 和 manifest 检查的唯一 home。适用对象：根、`apps/*`、`packages/*`。

## 三层版本

| 层         | 位置                                                | 当前策略                                                |
| ---------- | --------------------------------------------------- | ------------------------------------------------------- |
| 发布版本   | `package.json` 的 `version`                         | 私有包统一 `0.0.0`，不手动 bump；发布流程属于 CD 里程碑 |
| 依赖版本   | `pnpm-workspace.yaml` catalog + `pnpm-lock.yaml`    | 外部依赖只写 `catalog:*`；内部依赖只写 `workspace:*`    |
| 工具链版本 | `.nvmrc`、`engines`、`packageManager`、`devEngines` | 多处声明，必须一致；由 `pnpm check:manifests` 校验      |

## Catalog 分类

| catalog     | 内容                                                             | 范围                                    |
| ----------- | ---------------------------------------------------------------- | --------------------------------------- |
| `toolchain` | TypeScript、openspec、oxfmt、oxlint、oxlint-tsgolint             | 精确 pin                                |
| `dev`       | turbo、commitlint、husky、`@types/node`、yaml 等开发工具与类型包 | 允许 `^`；`@types/node` 主版本跟随 Node |
| `runtime`   | Next、React、tldraw、Nest、zod 等运行时依赖                      | 允许 `^`                                |

安装示例：

```bash
pnpm add -Dw <pkg> --save-catalog-name dev
pnpm add --filter @inkstack/<pkg> --save-catalog-name runtime <pkg>
```

## 字段标准

| 字段                | 根         | app（私有）   | package（私有）                             |
| ------------------- | ---------- | ------------- | ------------------------------------------- |
| `name`              | `inkstack` | `@inkstack/*` | `@inkstack/*`                               |
| `version`           | `0.0.0`    | `0.0.0`       | `0.0.0`                                     |
| `private`           | `true`     | `true`        | `true`                                      |
| `description`       | 必填       | 必填          | 必填                                        |
| `license`           | `ISC`      | `ISC`         | `ISC`                                       |
| `type`              | `module`   | `module`      | `module`；`@inkstack/tsconfig` 无代码不声明 |
| `exports` / `files` | —          | —             | 可被导入时必填                              |
| `scripts`           | 必填       | 实现时补      | 有代码时补                                  |

## Description 规则

- 一句话，40–120 字符；中英文均可。
- 说明"做什么"，不要重复包名。
- 不用营销词、TODO 或版本号。
- 检查脚本只验证长度、非空和"不等于 name"；语义由评审负责。

## 包文档

`packages/` 目录本身与 `packages/*` 的每个包目录 MUST 同时包含：

- `AGENTS.md`：以「补充根文件的规则」开头，只写该层特有约束。
- `CLAUDE.md`：只写 `@AGENTS.md`。
- `README.md`：职责、公开导出、命令与消费方式。

检查脚本验证文件存在与 `CLAUDE.md` 的内容。

## 检查规则

`pnpm check:manifests` 检查：

1. 名称格式：根 `inkstack`，其余 `@inkstack/<kebab-case>`。
2. `private: true`。
3. `description` 形态。
4. `license` 为 `ISC`。
5. 外部依赖只允许 `catalog:*`，内部依赖只允许 `workspace:*`。
6. `toolchain` catalog 的值必须是精确版本。
7. `.nvmrc`、`engines.node`、`packageManager`、`devEngines` 一致。
8. 根 scripts 存在；有 `src` 的包有 `build` / `typecheck`。
9. 私有包版本偏离 `0.0.0` 时输出 warning，不影响退出码。
10. `packages/` 与 `packages/*` 的 `AGENTS.md` / `CLAUDE.md` / `README.md` 三件套存在，且 `CLAUDE.md` 只写 `@AGENTS.md`。
11. 声明了 `exports` 的包有 `publint` script，且 `publint` 以 `catalog:dev` 声明在 devDependencies。
12. `packages/*` 中有运行时代码的包具备 `test` script、`vitest: catalog:dev` 与至少一个 `test/**/*.test.ts`；纯类型包必须在 `testExemptions` 中写明理由。

## 非目标

- tsconfig 的进一步拆分与对外分发。
- 发布版本、Changesets、changelog、git tag、`publishConfig`。
- 字段顺序、`keywords`、`author`、`repository`、包级 `engines`。
- CI 接入与 OpenWiki。
