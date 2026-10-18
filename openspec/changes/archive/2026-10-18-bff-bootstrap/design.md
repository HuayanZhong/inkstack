# Design

## Context

动机见 [proposal.md](proposal.md)。设计相关的现状：

- `packages/tsconfig/nest.json` 已存在（NodeNext + legacy decorators + `emitDecoratorMetadata` + `strictPropertyInitialization: false`），尚无消费者。
- `.oxlintrc.json` 为 `apps/gateway` 关闭了 `no-extraneous-class`、`no-useless-constructor`、`consistent-type-imports`，但 `apps/bff` 只拿到了 `env.node`，没有这组规则关闭。
- `apps/shell` 已经按同一套流程落地，本次沿用它的合并、metadata 与文档模式。

已用 `@nestjs/cli@12` 在临时目录实跑过一次，确认模板产物：`type: "module"`、`module: nodenext`、`strictPropertyInitialization: false`，并自带 `.oxlintrc.json`、`.prettierrc`、`.gitattributes`、Vitest 配置与示例测试。`main.ts` 使用 `process.env.PORT ?? 3000`。

## Goals / Non-Goals

**Goals:**

- `apps/bff` 能通过仓库根命令 `dev` / `build` / `lint` / `typecheck` 被驱动。
- 应用级配置符合仓库约定：catalog 依赖、`nest.json` 预设、根 oxlint 规则、`@inkstack/*` 命名。
- 保留 CLI 生成的项目结构（`nest-cli.json`、`tsconfig.build.json`、`src/`），方便对照上游升级。

**Non-Goals:**

- 不做任何业务能力：无 Supabase、无会话、无守卫、无 CORS、无 SSE、不调用 gateway。
- 不引入测试运行器；测试按阶段策略延后。
- 不抽共享的 Nest 启动样板（等 gateway 落地后再评估）。

## Decisions

### 1. 脚手架命令与合并

```bash
pnpm dlx @nestjs/cli@12 new bff \
  --package-manager pnpm --skip-git --skip-install --strict
```

在临时目录生成后并入 `apps/bff`。删除模板带来的：

| 文件                                       | 原因                                                |
| ------------------------------------------ | --------------------------------------------------- |
| `.oxlintrc.json`                           | 仓库只有根规则一个 home；包内规则文件会导致规则分叉 |
| `.prettierrc`                              | 格式由根 oxfmt 负责                                 |
| `.gitattributes`                           | 根目录已有                                          |
| `README.md`                                | 替换为本仓库自己的说明                              |
| `test/`、`src/app.controller.spec.ts`      | 测试延后                                            |
| `vitest.config.ts`、`vitest.config.e2e.ts` | 测试延后                                            |

保留 `nest-cli.json`、`tsconfig.build.json`、`src/`。`--skip-install` 保证依赖版本只由 catalog 决定。

### 2. 端口写死 4003

模板是 `await app.listen(process.env.PORT ?? 3000)`。改为 `app.listen(4003)`。

理由：骨架期不引入环境变量，一旦读取 `PORT`，`turbo/no-undeclared-env-vars` 会要求先在 `turbo.json` 声明；shell 同样写死 3000，保持一致。容器化阶段再统一改成显式声明的 env。

### 3. 健康检查替换示例代码

把 `AppController` / `AppService` 改名为 `HealthController` / `HealthService`，路由为 `GET /health`，返回：

```json
{ "status": "ok", "service": "bff" }
```

保留 controller + service + module 的接线，而不是让 controller 直接返回字符串：这条路径会真正走一遍构造器注入与 `emitDecoratorMetadata`，是 Nest 平面最重要的一处验证。

### 4. tsconfig

`apps/bff/tsconfig.json` 保留模板的 `compilerOptions`，增加 `"extends": "@inkstack/tsconfig/nest.json"`，并做两处调整：

- 删除 `"types": ["vitest/globals", "node"]`：测试已移除，`node` 由预设提供。
- 增加 `"tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo"`。`nest build` 的 `deleteOutDir: true` 会清空 `dist/`，缓存放进去会每次失效；`.turbo/` 已被 Git 忽略且不会被删除。

`tsconfig.build.json` 保持模板原样（`rootDir: ./src`、`include: ["src"]`），`typecheck` 以它为入口。

### 5. scripts

| script      | 命令                                                  |
| ----------- | ----------------------------------------------------- |
| `dev`       | `nest start --watch`                                  |
| `build`     | `nest build`                                          |
| `start`     | `nest start`                                          |
| `lint`      | `oxlint --config ../../.oxlintrc.json --type-aware .` |
| `typecheck` | `tsc -p tsconfig.build.json --noEmit`                 |

删除模板的 `format`、`test`、`test:watch`、`test:cov`、`test:e2e`、`test:debug`、`deploy`、`start:debug`、`start:prod`。格式化走根脚本，发布流程尚未存在。

### 6. 依赖与 catalog

`pnpm-workspace.yaml`：

```yaml
catalogs:
  runtime:
    '@nestjs/common': ^12.1.3
    '@nestjs/core': ^12.1.3
    '@nestjs/platform-express': ^12.1.3
    reflect-metadata: ^0.2.2
    rxjs: ^7.8.2
  dev:
    '@nestjs/cli': ^12.0.8
    '@types/express': ^5.0.6
```

版本以 registry 的 `latest` 为准，不抄脚手架模板里的范围——模板会滞后于实际发布。`@nestjs/schematics` 由 `@nestjs/cli` 传递引入，不单独声明。

移除模板里的 `@nestjs/mau`、`@nestjs/testing`、`@nestjs/schematics`、`@vitest/coverage-v8`、`supertest`、`@types/supertest`、`vitest`、`vite`、`oxlint`、`oxlint-tsgolint`、`prettier`、`source-map-support`。`typescript` 用 `catalog:toolchain`，`@types/node` 用 `catalog:dev`，`@inkstack/tsconfig` 用 `workspace:*`。

### 7. lint 规则关闭扩大到 bff

在 `.oxlintrc.json` 现有的 gateway override 中把 `files` 扩为：

```json
["apps/gateway/**/*.{ts,tsx}", "apps/bff/**/*.{ts,tsx}"]
```

原因：`consistent-type-imports` 会把构造器注入用到的类改成 `import type`，`emitDecoratorMetadata` 拿不到类引用，DI 在运行期失败。bff 是第二个 Nest 应用，必须与 gateway 一致。

## Risks / Trade-offs

- **tsbuildinfo 落在应用根** → 若模板默认位置与预期不符，以 `nest build` 的实际输出为准，调整 `tsBuildInfoFile`，不要留下根目录缓存文件。
- **`nest start --watch` 与 Turborepo persistent 任务** → `turbo.json` 的 `dev` 已是 `persistent: true, cache: false`，无需改动；若端口被残留进程占用，先确认 4003 已释放。
- **删除模板 `.oxlintrc.json` 后 lint 变严/变松** → 根规则是唯一标准；`--type-aware` 需要能解析 `tsconfig.build.json`，若报类型错误，改用 `--tsconfig` 显式指定。
- **Nest 12 的 `strict` 模板与 `nest.json` 重叠** → 应用级值覆盖预设；以 CLI 生成的值为准，不反向修改预设，除非出现明确冲突。
