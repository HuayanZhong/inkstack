# AGENTS.md

补充根文件的规则。本目录是 tsconfig 预设集合，没有运行时代码。

## 约束

- 只放 `compilerOptions`；`include`、`exclude`、`rootDir`、`outDir`、`paths` 留在消费包。
- 预设之间的继承关系与选择规则以 `docs/typescript.md` 为准，不在本目录复述。
- 新增或重命名预设时同步更新 `package.json` 的 `exports` 与 `docs/typescript.md`。
- 除 `publint` 外不引入依赖；无构建脚本；预设由 TypeScript 直接读取。

## 目录

- `base.json`：语言与严格性，不直接使用。
- `node.json` / `nest.json` / `library.json`：Node 平面。
- `react.json` / `next.json`：浏览器平面。
