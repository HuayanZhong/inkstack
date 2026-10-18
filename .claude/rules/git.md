# Git 提交规则

除非用户在当次对话中明确要求，否则不执行任何会改变工作区、分支或历史的 Git 命令。默认把改动留在工作区，由用户自己检查并提交。上一次对话的授权不延续到下一次。

## 允许的只读命令

`git status`、`git diff`、`git log`、`git show`、`git branch`、`git ls-files`、`git blame`、`git grep`、`git rev-parse`、`git remote -v`。

`git branch` 只用于查看，不带 `-d`、`-D`、`-m` 等修改参数。

## 需要当次明确要求的命令

`switch -c`（创建分支）、`add`、`commit`、`push`、`tag`、`reset`、`clean`、`restore`、`stash`、`rebase`、`merge`、`pull`。

- 禁止用 `--no-verify` 绕过 husky / commitlint，除非用户当次明确要求。
- 禁止 `push --force`；确需重写历史时先确认远程状态，并使用 `--force-with-lease`。
- 不丢弃、覆盖或回滚用户未提交的改动。

## 提交信息

提交信息必须符合 Conventional Commits（<https://www.conventionalcommits.org/>），由 husky 的 `commit-msg` hook 与 commitlint 校验：

```bash
echo "chore: 验证提交信息" | pnpm lint:commit
git log -1 --pretty=%B | pnpm lint:commit
```

需要提交时，先给出建议的提交信息并等待确认，不要直接执行。
