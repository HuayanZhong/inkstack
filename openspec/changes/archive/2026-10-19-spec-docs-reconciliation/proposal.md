# Proposal

## Why

骨架期连续完成了 MF、配置包、Gateway 与工作流改造，但规格与文档没有同步：三条现有规格描述的行为与代码不一致，`docs/toolchain.md` 仍在描述已删除的 knip 条目和旧的 eslint 机制，Gateway 持久化归属在三处文档里互相冲突。规格是仓库的唯一行为来源，保留错误描述会让后续 `action-protocol-and-gateway` 等变更建立在错误前提上。

## What Changes

- 修正 `shell-canvas-consumer`：`NEXT_PUBLIC_CANVAS_MF_ENTRY` 是必填配置，未设置时启动失败；删除不存在的 localhost 回退。
- 修正 `canvas-remote-provider`：dev 的 publicPath 由 `CANVAS_HOST` 与 `CANVAS_PORT` 组成，不再固定 `localhost:4002`；production 仍为 `auto`。
- 扩展 `environment-configuration`：从只约束 BFF 改为约束 shell / canvas / bff / gateway 四个应用，覆盖启动前校验、各应用端口变量、类型化读取与客户端 `NEXT_PUBLIC_*` 的构建期内联例外。
- 统一 Gateway 持久化归属表述：Gateway 负责 action log 与 `design.json` 快照持久化，canvas 只执行并 ack、不写文件；具体持久化协议留给 `action-protocol-and-gateway`。
- 回正文档漂移：
  - `docs/toolchain.md`：Vitest 5 的 peer 事实、knip 已删除的 entry 与 `.claude/**` 忽略、`autoInstallPeers: false` 的 eslint 机制、已安装的运行时依赖。
  - `docs/package-metadata.md`：pre-commit 已接入，不再是"未来接入"。
  - `docs/architecture/DESIGN-RECORD.md`：lint 已接入，不再列在延后项。
  - `apps/gateway/AGENTS.md`：删除与自身"持久化"职责矛盾的"不直接写 design.json"。

**BREAKING**：无。本次只改规格与文档，不改变任何运行时行为。

## Capabilities

### New Capabilities

无。Gateway 持久化的详细协议属于后续 `action-protocol-and-gateway`，本次只统一现有文档表述，不提前定义行为。

### Modified Capabilities

- `canvas-remote-provider`: 「资源地址按环境区分」改为 dev 使用 `CANVAS_HOST` / `CANVAS_PORT` 组合地址，production 使用 `auto`。
- `environment-configuration`: 校验、端口与类型化配置要求从 BFF 扩展到全部应用，并明确客户端 `NEXT_PUBLIC_*` 由构建期内联而非服务端配置对象提供。
- `shell-canvas-consumer`: 「远程入口可配置」改为必填，删除未配置时的 localhost 回退。

## Impact

- 规格：`openspec/specs/canvas-remote-provider/spec.md`、`openspec/specs/environment-configuration/spec.md`、`openspec/specs/shell-canvas-consumer/spec.md`。
- 文档：`docs/toolchain.md`、`docs/package-metadata.md`、`docs/architecture/DESIGN-RECORD.md`、`apps/gateway/AGENTS.md`。
- 代码与依赖：无。若文档回正时发现 must-fix 的实现偏差，只记录并另行提案，不在本次顺手修改运行时。
