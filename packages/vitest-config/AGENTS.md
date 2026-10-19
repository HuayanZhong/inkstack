# AGENTS.md

补充根文件的规则。本目录是 Vitest 预设包，只导出测试配置对象。

## 职责

- 提供 `nodeConfig`、`reactConfig`、`nestConfig` 三个预设。
- 只声明测试收集范围与环境，不导入任何应用或业务代码。
- 应用用 `defineConfig` + `mergeConfig` 组合预设与自身配置。

## 目录

- `src/index.ts`：预设导出。
- `test/index.test.ts`：预设形状测试。

## 约束

- 新增预设时保持 `include` 指向 `test/**`、`exclude` 包含 `dist`。
- 覆盖率 provider、reporter 与门槛在这里统一；使用方只声明 `coverage.include` 与排除理由。
- 依赖只通过 catalog 引用；构建到 `dist`，消费方用 `workspace:*`。
