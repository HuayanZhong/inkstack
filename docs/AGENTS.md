# docs/AGENTS.md

## 权威归属

| 事实        | 权威                                      | 性质                   |
| ----------- | ----------------------------------------- | ---------------------- |
| 行为要求    | `openspec/specs/`                         | 规范                   |
| Agent 规则  | `AGENTS.md` 手写区、`.claude/rules/`      | 规范                   |
| 架构决策    | `DESIGN-RECORD.md`                        | 规范/历史              |
| 图源        | `docs/architecture/source/*.json`         | 规范                   |
| 状态        | `README.md`                               | 信息性                 |
| 代码现实    | 源码 + 测试                               | 事实                   |
| 生成物      | `openwiki/`、`interactive/`、`images/`    | 派生；未知项是验证缺口 |
| 包元数据    | `docs/package-metadata.md`                | 规范                   |
| 工具链与 TS | `docs/toolchain.md`、`docs/typescript.md` | 规范                   |
| 测试        | `docs/testing.md`                         | 规范                   |
| CI/CD       | `docs/ci-cd.md`                           | 蓝图 + 现状            |

## 规则

- 一条事实一个 home；冲突按上表取权威；其他位置只链接，不复述。只写当前状态，不写变更历史（"previously / now / 已改为"），状态只写在 README.md 并带复查条件；历史留在 Git、变更归档和决策记录。
- 生成物永不手改：改 `source/*.json` 后重新生成 HTML/PNG；OpenWiki 接入后改源码或 `openwiki/INSTRUCTIONS.md`，由工具重建。
- `AGENTS.md` / `CLAUDE.md` 中的 `OPENWIKI:START/END`、`nextjs-agent-rules`、`turborepo-agent-rules` 标记块由工具维护；只编辑标记外，预算与链接检查跳过标记内。
- 预算按手写区计算：根 `AGENTS.md` ≤70 行且 ≤3,200 非空白字符；子树和本文件 ≤25 行且 ≤1,000。
- `DESIGN-RECORD` 的状态只用 `已定 / 已取代 / 待定`；`已取代` 必须链接新决策；`openspec/changes/archive/` 冻结，`openspec/specs/` 是当前来源。
