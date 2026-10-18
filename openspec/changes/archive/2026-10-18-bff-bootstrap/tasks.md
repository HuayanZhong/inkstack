# Tasks

## 1. Catalog 与共享配置

- [x] 1.1 在 `pnpm-workspace.yaml` 的 `runtime` catalog 增加 `@nestjs/common`、`@nestjs/core`、`@nestjs/platform-express`、`reflect-metadata`、`rxjs`，在 `dev` catalog 增加 `@nestjs/cli`、`@types/express`；验证：`pnpm check:manifests` 输出 0 errors，且七个条目都能从 `pnpm-workspace.yaml` 读到。
- [x] 1.2 在 `.oxlintrc.json` 现有的 gateway override 中把 `files` 扩展为同时包含 `apps/bff/**/*.{ts,tsx}`；验证：`pnpm exec oxlint --config .oxlintrc.json --print-config apps/bff/src/main.ts` 能正常输出（不报配置错误），且 gateway 条目仍在。

## 2. 脚手架并入

- [x] 2.1 在临时目录用 `pnpm dlx @nestjs/cli@12 new bff --package-manager pnpm --skip-git --skip-install --strict` 生成骨架，并入 `apps/bff`；删除 `.oxlintrc.json`、`.prettierrc`、`.gitattributes`、`README.md`、`test/`、`src/app.controller.spec.ts`、`vitest.config.ts`、`vitest.config.e2e.ts`；验证：`find apps/bff -maxdepth 2 -type f` 只剩 `nest-cli.json`、`package.json`、`tsconfig.json`、`tsconfig.build.json` 与 `src/` 下的四个源文件。
- [x] 2.2 改写 `apps/bff/package.json`：名称 `@inkstack/bff`、版本 `0.0.0`、`private`、`license: ISC`、40–120 字符中文描述、`"type": "module"`；依赖全部换成 catalog 引用并删除模板多余依赖；补齐 `dev`、`build`、`start`、`lint`、`typecheck` 五个 scripts；删除 `packageManager` 字段；验证：`pnpm install` 成功，`pnpm check:manifests` 输出 0 errors，`pnpm --filter @inkstack/bff exec nest --version` 输出 `12.x`。
- [x] 2.3 在 `apps/bff/tsconfig.json` 增加 `"extends": "@inkstack/tsconfig/nest.json"`，删除 `types` 中的 `vitest/globals`，增加 `"tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo"`；验证：`pnpm --filter @inkstack/bff typecheck` 通过，`pnpm --filter @inkstack/bff build` 后 `apps/bff` 根目录没有 `*.tsbuildinfo`。

## 3. 启动与健康检查

- [x] 3.1 把 `src/main.ts` 的监听端口改为 `4003`，不再读取 `process.env.PORT`；验证：`grep -n "listen" apps/bff/src/main.ts` 只出现 `4003`。
- [x] 3.2 把 `AppController` / `AppService` 改名为 `HealthController` / `HealthService`，路由改为 `GET /health` 并返回 `{ status: 'ok', service: 'bff' }`，同步更新 `AppModule` 的接线；验证：`pnpm --filter @inkstack/bff build` 通过，`grep -rn "HealthController" apps/bff/src` 有结果。

## 4. 文档

- [x] 4.1 新增 `apps/bff/AGENTS.md`（职责、目录、命令、约束，以「补充根文件的规则」开头）与只写 `@AGENTS.md` 的 `CLAUDE.md`；验证：手写区 ≤25 行且 ≤1,000 非空白字符，`CLAUDE.md` 内容仅为 `@AGENTS.md`。
- [x] 4.2 新增 `apps/bff/README.md`：职责、运行命令、当前状态（只有 `/health`）、相关文档链接；验证：`pnpm format:check` 通过。
- [x] 4.3 更新根 `README.md`：`apps/bff` 已能启动，其余应用说明同步；验证：README 不再声称 bff 只有 `package.json`。

## 5. 集成验证

- [x] 5.1 在仓库根依次执行 `pnpm install`、`pnpm typecheck`、`pnpm lint`、`pnpm build`；验证：四条命令全部成功，`build` 产出 `apps/bff/dist` 与 `apps/shell/.next`。
- [x] 5.2 在仓库根执行 `pnpm dev`，确认 shell 在 `:3000`、bff 在 `:4003`，另加 contracts 的监听任务；验证：`curl -s http://localhost:4003/health` 返回包含 `"status":"ok"` 与 `"service":"bff"` 的 JSON，`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` 返回 `200`。
- [x] 5.3 检查 `git status`：验证：改动都在 `apps/bff/`、`.oxlintrc.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、根 `README.md` 与本次 change 目录内；`dist/`、`.turbo/`、`*.tsbuildinfo` 未被跟踪。

## Workflow follow-up

- 评审通过后归档本次 change。
