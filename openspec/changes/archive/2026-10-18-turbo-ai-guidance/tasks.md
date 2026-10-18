# Tasks

## 1. Turbo 配置与托管块

- [x] 1.1 在根 `turbo.json` 增加 `"agentGuidance": true`，并给 `build`、`dev`、`lint`、`typecheck` 补中文 `description`（只写「做什么 + 关键约束」，不复述依赖与输出）；运行 `pnpm exec turbo run typecheck --dry=json` 确认配置被解析且退出码为 0，再用 `node -e` 断言四个任务都存在 `description`。
- [x] 1.2 保持 `CLAUDE_CODE` 环境变量存在，运行一次 `pnpm exec turbo run typecheck --dry=json` 触发写入；确认根 `AGENTS.md` 出现 `<!-- BEGIN:turborepo-agent-rules -->` / `<!-- END:turborepo-agent-rules -->`，块内指向随包安装的 `docs/README.md`，块外内容未被改动（`git diff AGENTS.md` 只显示新增块）。

## 2. Turborepo Skill

- [x] 2.1 从上游 `vercel/turborepo` 的 `skills/turborepo/SKILL.md` 取当前内容，vendor 到 `.agents/skills/turborepo/SKILL.md`（保留 frontmatter 的 `name` / `description`）；运行 `node -p "require.resolve('turbo/package.json')"` 确认 Skill 中记录的位置解析命令可用，并确认 `.claude/skills/turborepo/SKILL.md` 通过现有软链可读到同一文件。

## 3. 文档

- [x] 3.1 在 `docs/toolchain.md` 新增「Turborepo 与 AI」小节：说明 bundled docs 路径、`turbo docs` 的版本化检索、托管块归 turbo 所有且只编辑块外内容；逐条运行文中命令，确认输出与描述一致。
- [x] 3.2 在根 `AGENTS.md` 的「编辑本文件」段落和 `docs/AGENTS.md` 的标记列表中补 `turborepo-agent-rules`；运行行数与非空白字符统计，确认根 `AGENTS.md` ≤70 行且 ≤3,200 字符、`docs/AGENTS.md` ≤25 行且 ≤1,000 字符（统计时排除标记块），并确认两处列表都包含该标记。

## 4. 集成验证

- [x] 4.1 运行 `pnpm format`，再运行一次 `pnpm exec turbo run typecheck --dry=json`，最后执行 `git diff --exit-code AGENTS.md`；若出现 diff，按 `design.md` 第 5 条加入 `<!-- prettier-ignore -->` 后重复本任务，直到无 diff。
- [x] 4.2 依次运行 `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm check:manifests`，确认全部退出码为 0。
- [x] 4.3 运行 `git status --short` 与 `git diff --stat`，确认改动只包含 `turbo.json`、`AGENTS.md`、`docs/AGENTS.md`、`docs/toolchain.md` 和新增的 `.agents/skills/turborepo/SKILL.md`，没有依赖变化、没有临时文件残留。

## Workflow follow-up

- 变更实现并验证完成后，按项目流程运行 `/opsx:archive`。
- 托管块与 Skill 需要随本次改动一起提交，否则后续每次 turbo 调用都会产生脏文件；提交由用户执行。
