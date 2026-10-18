# Tasks

## 1. 重命名与基础预设

- [x] 1.1 将 `packages/config` 重命名为 `packages/tsconfig`，包名改为 `@inkstack/tsconfig`；把 `tsconfig.base.json` / `tsconfig.node.json` / `tsconfig.react.json` 重命名为 `base.json` / `node.json` / `react.json`，并把 `package.json` 的 `exports` / `files` 更新为新名称；运行 `node -e` 解析 `packages/tsconfig/*.json`，确认所有预设是合法 JSON，且 `exports` 覆盖 `base` / `node` / `react`。
- [x] 1.2 重写 `base.json`：移除 `module` 与 `moduleResolution`，保留 `target: ES2024` 与现有严格性选项；在 `node.json` 中设置 `module: NodeNext`、`moduleResolution: NodeNext`、`lib: ["ES2024"]`、`types: ["node"]`；在 `react.json` 中设置 `module: ESNext`、`moduleResolution: bundler`、DOM libs、`jsx: react-jsx`、`types: []`；运行 `node -e` 验证各文件的关键字段与预期一致。
- [x] 1.3 新增 `nest.json`（继承 node，增加 `experimentalDecorators`、`emitDecoratorMetadata`、`strictPropertyInitialization: false`）、`library.json`（继承 node，增加 `declaration`、`declarationMap`、`sourceMap`）、`next.json`（继承 react，增加 `jsx: preserve`、`noEmit`、`allowJs`、`incremental`、`types: ["node"]`、`plugins: [{ "name": "next" }]`）；更新 `exports`，运行 `node -e` 验证六个预设都存在且 `extends` 指向正确。

## 2. contracts 转 ESM

- [x] 2.1 将 `packages/contracts/package.json` 的 `"type"` 改为 `"module"`，`devDependencies` 改为 `"@inkstack/tsconfig": "workspace:*"`，`tsconfig.json` 的 `extends` 改为 `@inkstack/tsconfig/library.json`；运行 `pnpm install`，确认 workspace 链接重建且 `pnpm --filter @inkstack/contracts list` 显示 `@inkstack/tsconfig@link:../tsconfig`。
- [x] 2.2 运行 `pnpm typecheck` 与 `pnpm build`，确认 contracts 通过；检查 `packages/contracts/dist/index.js` 使用 ESM 语法（包含 `export`，没有 `exports.` 或 `require(`），证明模块格式已切换。

## 3. 预设验证（临时 fixture）

- [x] 3.1 创建 `.tmp/tsconfig-probe/nest/`，写入一个带本地 `@Injectable()` 装饰器与构造器注入的 `probe.ts`，`tsconfig.json` 继承 `../../../packages/tsconfig/nest.json` 并 `include` 该文件；运行 `pnpm exec tsc -p .tmp/tsconfig-probe/nest/tsconfig.json`，确认装饰器与元数据选项被接受。
- [x] 3.2 创建 `.tmp/tsconfig-probe/next/`，写入一个 `.tsx` 文件（包含 JSX 与 `process.env`）和最小 `JSX.IntrinsicElements` 声明，`tsconfig.json` 继承 `../../../packages/tsconfig/next.json`；运行 `pnpm exec tsc -p .tmp/tsconfig-probe/next/tsconfig.json`，确认 `jsx: preserve` 与 `types: ["node"]` 同时生效。
- [x] 3.3 创建 `.tmp/tsconfig-probe/react/`，写入一个 `.tsx` 文件、最小 `JSX.IntrinsicElements` 声明与 `react/jsx-runtime` 模块声明，`tsconfig.json` 继承 `../../../packages/tsconfig/react.json`；运行 `pnpm exec tsc -p .tmp/tsconfig-probe/react/tsconfig.json`，确认 `react-jsx` 与 DOM libs 生效。
- [x] 3.4 删除 `.tmp/tsconfig-probe/`，运行 `git status --short`，确认没有临时 fixture 残留在工作区。

## 4. manifest 检查

- [x] 4.1 在 `scripts/check-manifests.mjs` 增加两项检查：存在 `tsconfig.json` 的包必须 `extends` 以 `@inkstack/tsconfig/` 开头的路径，并在 `devDependencies` 声明 `"@inkstack/tsconfig": "workspace:*"`；存在 `src/` 的包必须声明 `"type": "module"`；运行 `pnpm check:manifests`，确认现有 7 个 manifest 全部通过，没有误伤占位包。

## 5. 文档

- [x] 5.1 新增 `docs/typescript.md`，记录预设图、包到预设的映射、base 不直接使用、`module` / `moduleResolution` 由平面声明、NodeNext 下 `.js` 扩展名、Nest 的 `strictPropertyInitialization: false` 理由、Next 会改写 tsconfig、`tsconfig.build.json` 的约定，以及预设只放 compilerOptions；对照 `packages/tsconfig/*.json` 检查文中字段与命令真实存在。
- [x] 5.2 更新 `docs/AGENTS.md` 权威表（工具链与 TypeScript 配置）、`docs/package-metadata.md`（`type` 行改为 `module`，包名引用改为 `@inkstack/tsconfig`）、`docs/toolchain.md`（tsconfig 改为链接到新文档）、根 `AGENTS.md`（包名与文档链接）、`README.md`（`config/` 改为 `tsconfig/`，BFF 改为 NestJS）；运行字数检查，确认根 `AGENTS.md` 62 行 / 3,088 非空白字符、`docs/AGENTS.md` 25 行 / 975 非空白字符，均符合预算，并确认没有非归档的 `@inkstack/config` 引用。

## 6. 集成验证

- [x] 6.1 依次运行 `pnpm install`、`pnpm format`、`pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm check:manifests`，确认全部退出码为 0。
- [x] 6.2 运行 `git diff --stat` 与 `git status --short`，确认改动只包含包重命名、六个预设、contracts 的 ESM 迁移、manifest 检查与文档；确认没有新增 Nest / Next / React 运行时依赖，没有 Node 版本变化，也没有临时 fixture 残留。

## Workflow follow-up

- 变更实现并验证完成后，按项目流程运行 `/opsx:archive`。
- 归档前确认工作区改动已由用户检查，不代用户执行提交。
