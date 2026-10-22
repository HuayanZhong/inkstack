# Spec Delta

## ADDED Requirements

### Requirement: 规则必须显式声明加载范围

`.claude/rules/` 下的每个规则文件 SHALL 声明非空 `paths:` frontmatter，或被列入检查器中的常驻白名单且写明理由。两者都没有、`paths` 为空或白名单缺理由时，文档检查 MUST 失败。

#### Scenario: 路径范围规则

- **WHEN** 规则文件声明了非空 `paths:` 列表
- **THEN** 文档检查通过，该规则只在匹配文件时加载

#### Scenario: 未声明且未登记

- **WHEN** 某个规则文件既没有 `paths:`，也不在常驻白名单中
- **THEN** 文档检查失败，并指出该规则文件

#### Scenario: 常驻白名单缺理由

- **WHEN** 某个规则被列入常驻白名单但没有写明理由
- **THEN** 文档检查失败，并指出该条目

#### Scenario: 空 paths

- **WHEN** 规则声明了 `paths:` 但列表为空
- **THEN** 文档检查失败，并指出该规则文件

### Requirement: 路径范围规则必须可发现

每条声明 `paths:` 的规则 SHALL 被至少一个当前 `AGENTS.md` 以相对路径链接；未被任何 `AGENTS.md` 链接时，文档检查 MUST 失败并指出规则文件。

#### Scenario: 根文件已链接

- **WHEN** 路径范围规则在根 `AGENTS.md` 中有相对链接
- **THEN** 文档检查通过

#### Scenario: 规则未被链接

- **WHEN** 一条路径范围规则没有出现在任何 `AGENTS.md` 中
- **THEN** 文档检查失败，并指出该规则文件

#### Scenario: 常驻规则豁免

- **WHEN** 规则在常驻白名单中但没有链接
- **THEN** 不要求链接，文档检查通过
