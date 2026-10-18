# canvas-remote-provider Specification

## Purpose

定义 canvas 作为 Module Federation provider 时对外可观察的构建产物、模块边界、启动方式、共享依赖与资源地址规则，使任意标准 consumer 都能稳定加载画布。

## Requirements

### Requirement: 构建产物包含标准远程入口与清单

canvas 的 production 构建 SHALL 产出 `remoteEntry.js` 与 `mf-manifest.json`，两者位于同一输出目录。

#### Scenario: 生产构建产物完整

- **WHEN** 执行 canvas 的 production 构建
- **THEN** 输出目录同时存在 `remoteEntry.js` 与 `mf-manifest.json`
- **AND** `mf-manifest.json` 的 `exposes` 包含 `./Canvas`

### Requirement: 公开模块边界保持单一

canvas SHALL 只通过 `./Canvas` 暴露画布组件；独立页面与远程消费 MUST 渲染同一份组件实现。

#### Scenario: 远程与独立页面一致

- **WHEN** consumer 加载 `canvas/Canvas`
- **THEN** 得到与 canvas 独立页面相同的画布组件
- **AND** canvas 不暴露其他应用内部模块

### Requirement: 入口异步初始化由构建器负责

canvas SHALL 使用构建器的异步启动能力初始化共享模块；应用入口 MUST NOT 依赖手写的动态导入作为异步边界。

#### Scenario: 无手写异步边界仍可启动

- **WHEN** canvas 以 dev 或 production 模式启动
- **THEN** 共享模块在应用代码执行前完成初始化
- **AND** 控制台不出现 eager consumption 相关错误
- **AND** 入口文件不再包含仅用于异步边界的 `import('./App')`

### Requirement: 资源地址按环境区分

canvas 的 publicPath SHALL 在 dev 指向 `http://localhost:4002/`，在 production 使用部署时自动解析的地址；production 产物 MUST NOT 写入 localhost 地址。

#### Scenario: 生产清单不包含 localhost

- **WHEN** 检查 production 构建生成的 `mf-manifest.json`
- **THEN** 其中远程资源地址不包含 `localhost`
- **AND** 资源按部署源解析

### Requirement: React 以单例共享

canvas SHALL 把 `react` 与 `react-dom` 声明为 singleton 共享，并采用 `loaded-first` 共享策略；`tldraw` MUST NOT 放入 shared。

#### Scenario: host 已加载 React

- **WHEN** consumer 在加载 canvas 前已注册 React 单例
- **THEN** canvas 复用 consumer 的 React 实例
- **AND** 页面中不存在第二份 React 运行时

### Requirement: 生成远程类型产物

canvas 的构建 SHALL 生成暴露模块的类型产物，供外部 consumer 获取 `./Canvas` 的类型信息。

#### Scenario: 类型产物随构建生成

- **WHEN** 执行 canvas 构建
- **THEN** 输出中包含远程类型压缩产物
- **AND** `mf-manifest.json` 能定位该类型产物
