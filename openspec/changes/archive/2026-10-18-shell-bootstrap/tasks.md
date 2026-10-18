# Tasks

## 1. Catalog

- [x] 1.1 在 `pnpm-workspace.yaml` 的 `runtime` catalog 增加 `next`、`react`、`react-dom`，在 `dev` catalog 增加 `@types/react`、`@types/react-dom`；验证：`pnpm check:manifests` 仍输出 0 errors，且 `pnpm-workspace.yaml` 中能读到五个新条目。

## 2. 脚手架并入

- [x] 2.1 在临时目录用 `pnpm create next-app@latest shell --ts --app --src-dir --no-eslint --no-tailwind --no-agents-md --skip-install --disable-git --use-pnpm` 生成骨架，并入 `apps/shell`；只删除模板带来的 `pnpm-workspace.yaml`、`.gitignore`、`README.md`，`public/` 资源与样式文件原样保留；验证：`git status` 中没有被删除的 `public/*.svg`、`*.css` 文件。
- [x] 2.2 改写 `apps/shell/package.json`：名称 `@inkstack/shell`、版本 `0.0.0`、`private`、`license: ISC`、40–120 字符中文描述；依赖全部换成 catalog 引用；补齐 `dev`、`build`、`start`、`lint`、`typecheck` 五个 scripts；删除 `packageManager` 字段；验证：`pnpm install` 成功，`pnpm check:manifests` 输出 0 errors，`pnpm --filter @inkstack/shell exec next --version` 输出 `16.4.2`。
- [x] 2.3 在 `apps/shell/tsconfig.json` 增加 `"extends": "@inkstack/tsconfig/next.json"`，保留模板生成的 `compilerOptions` 与 `paths`；验证：`pnpm --filter @inkstack/shell typecheck` 通过，且首次 `build` 后 `git diff apps/shell/tsconfig.json` 中没有被 Next 改回的值（有则按 design 记录的方式同步预设与文档）。

## 3. 首屏与样式

- [x] 3.1 移除 `src/app/layout.tsx` 的 `next/font/google` 引用与 `<html className>`，`lang` 改为 `zh-CN`，`metadata` 改为「墨栈 Inkstack」与一句话说明；验证：`grep -r "next/font" apps/shell/src` 无结果，`pnpm --filter @inkstack/shell build` 通过。
- [x] 3.2 在模板页面结构上改写文案：替换 `src/app/page.tsx` 里的标题、说明与链接文字，保留页面结构、全部 `className` 与 `page.module.css` 不变；验证：`grep -r "Create Next App" apps/shell/src` 无结果，`git status` 中没有被删除的 `.css` 文件，构建通过。
- [x] 3.3 在 `globals.css` 的 `font-family` 中补中文回退（`"PingFang SC"`、`"Microsoft YaHei"`）；验证：`pnpm format:check` 通过，dev 页面文字使用系统字体。

## 4. 文档

- [x] 4.1 新增 `apps/shell/AGENTS.md`（职责、目录、命令、约束，以「补充根文件的规则」开头）与只写 `@AGENTS.md` 的 `CLAUDE.md`；验证：手写区 ≤25 行且 ≤1,000 非空白字符，`CLAUDE.md` 内容仅为 `@AGENTS.md`。
- [x] 4.2 重写根 `README.md` 中「当前为骨架阶段：各包只有 package.json」一段，说明 shell 已可启动、其余三个应用尚未实现；验证：README 不再声称所有包都没有 scripts。

## 5. 集成验证

- [x] 5.1 在仓库根依次执行 `pnpm install`、`pnpm typecheck`、`pnpm lint`、`pnpm build`；验证：四条命令全部成功，`build` 产出 `apps/shell/.next`。
- [x] 5.2 在仓库根执行 `pnpm dev`，确认只有 shell 启动在 `:3000`，其余三个应用报告无可执行任务；验证：`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` 返回 `200`，页面包含「墨栈」。
- [x] 5.3 检查 `git status`：验证：新增与修改的文件都在 `apps/shell/`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`README.md` 与本次 change 目录内，`.next/`、`next-env.d.ts` 未被跟踪。

## Workflow follow-up

- 评审通过后归档本次 change。
