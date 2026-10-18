# Design

## Context

- 当前预设只有 `base` / `node` / `react`，位于 `packages/config`；唯一消费者是 `packages/contracts`。
- `tsconfig.base.json` 携带 `module: ESNext` + `moduleResolution: bundler`；`node` preset 再覆盖为 NodeNext。
- `packages/contracts` 是仓库唯一的 CommonJS 包；Nest 12、AI SDK、Next 都使用 ESM，BFF 已确定使用 Nest。
- 应用尚未实现：gateway / bff / shell / canvas 只有占位 `package.json`，没有 tsconfig 或源码。
- Turborepo 按包执行 `typecheck` / `build`；没有根 solution tsconfig，也没有 project references。
- 工具链已固定 Node 24.14.1、TypeScript 6.0.3；Node 升级不在本变更内。

## Goals / Non-Goals

**Goals:**

- 把 tsconfig 的所有权、预设边界和模块格式固定下来，让后续应用落地时只需要选预设、写本地差异。
- 消除仓库内唯一的 CommonJS 例外，使所有代码包在同一 ESM 语义下编译与导入。
- 用可执行的检查防止包绕过 `@inkstack/tsconfig` 或回退到 CommonJS。

**Non-Goals:**

- 不创建根 `tsconfig.json`、project references 或 `tsc -b` 聚合。
- 不创建 gateway / bff / shell / canvas 的应用级 tsconfig；应用落地时再建。
- 不引入 vitest / vite 预设；未来独立为 `@inkstack/vitest-config`。
- 不安装 Nest / Next / React / tldraw 等运行时依赖。
- 不更新 `docs/architecture/source` 与交互图；BFF 的架构图源更新单独处理。
- 不升级 Node。

## Decisions

### 1. 包名改为 `@inkstack/tsconfig`，目录改为 `packages/tsconfig`

- 预设文件去掉 `tsconfig.` 前缀：`base.json`、`node.json`、`nest.json`、`library.json`、`react.json`、`next.json`。
- 消费方式：`"extends": "@inkstack/tsconfig/node.json"`。
- 替代方案：保留 `@inkstack/config`。拒绝原因：名字过宽，会继续吸收 vitest、lint、bundler 配置，边界消失。
- 替代方案：`@inkstack/typescript-config`。拒绝原因：更长，且没有比 `tsconfig` 多出有效信息。
- 未来 vitest 预设放独立的 `@inkstack/vitest-config`，不回到这个包。

### 2. base 只保留语言与严格性

- `base.json` 移除 `module` 与 `moduleResolution`；由 `node` / `react` 各自声明。
- `base.json` 保留 `target: ES2024`、strict 系列、`isolatedModules`、`skipLibCheck`、`esModuleInterop`、`resolveJsonModule`、`verbatimModuleSyntax: false`。
- 替代方案：base 继续提供 bundler 默认值。拒绝原因：Node 包如果忘记选 `node` preset，会静默使用 bundler 解析，类型检查通过但运行时不符。
- `base.json` 不直接作为包的 `extends` 目标；文档中明确要求选择平面预设。

### 3. 预设图

```
base
├── node
│   ├── nest
│   └── library
└── react
    └── next
```

- `node`：`module: NodeNext`、`moduleResolution: NodeNext`、`lib: ["ES2024"]`、`types: ["node"]`。
- `nest`：继承 node，增加 `experimentalDecorators`、`emitDecoratorMetadata`、`strictPropertyInitialization: false`。
- `library`：继承 node，增加 `declaration`、`declarationMap`、`sourceMap`。暂不设置 `composite`。
- `react`：`module: ESNext`、`moduleResolution: bundler`、DOM libs、`jsx: react-jsx`、`types: []`。
- `next`：继承 react，增加 `jsx: preserve`、`noEmit`、`allowJs`、`incremental`、`types: ["node"]`、`plugins: [{ "name": "next" }]`。

### 4. 所有代码包统一 ESM

- `packages/contracts` 的 `package.json` 改为 `"type": "module"`。
- `node` 与 `library` 使用 NodeNext；相对导入必须写 `.js` 扩展名。
- 替代方案：contracts 保持 CommonJS，通过 Node interop 被 ESM 应用导入。拒绝原因：一旦 contracts 增加枚举、常量或具名函数，CJS 命名导出识别会成为隐性边界；现在没有外部消费者，迁移成本最低。

### 5. Nest 预设采用官方模板的严格性取舍

- `strictPropertyInitialization: false` 只作用于 `nest` 预设，不影响 base。
- 理由：Nest 的构造器注入与 DTO 在完全 strict 下噪音较大；Nest 12 官方 ESM 模板也关闭此项。
- 替代方案：保持 strict，要求所有属性用 `!` 或默认值。拒绝原因：会让 DTO 和注入类产生大量非业务噪音。

### 6. Next 预设只放 compilerOptions

- `next.json` 不设置 `include` / `exclude`。Next 会自己改写 `apps/shell/tsconfig.json` 并加入 `next-env.d.ts`、`.next/types/**`。
- `noEmit: true` 与 `jsx: preserve` 由预设提供；`paths`、`include` 留给应用。
- `types: ["node"]` 是刻意选择：Next 的服务端代码需要 `process` 等 Node 全局类型。代价是客户端文件也能看到 Node 全局；当前接受，未来可拆分。
- 替代方案：让 Next 应用完全自己维护 tsconfig，不使用预设。拒绝原因：会丢失仓库统一的严格性设置。

### 7. 预设只放 compilerOptions

- `include`、`exclude`、`rootDir`、`outDir`、`paths` 全部留在包内。
- 原因：`extends` 中的相对路径按预设文件所在目录解析，放进预设会指向 `packages/tsconfig` 而不是消费者。
- `contracts` 继续只写自己的 `rootDir` / `outDir` / `include`。

### 8. `verbatimModuleSyntax` 保持 `false`

- ESM 下开启 `true` 能提前抓 CJS/ESM 错配，但会让 Nest 的 DI 导入更敏感（值导入被写成 `import type` 时丢失类引用）。
- 等 gateway / bff 的 DI 测试稳定后再评估，不在本次变更中冒险。

### 9. 不引入根 solution 与 project references

- Turborepo 已按包执行 `typecheck` / `build`；project references 需要 `composite` 与每个包显式 references，当前没有跨包 `tsc -b` 增量构建的收益。
- dsh 的 host/client 聚合是为了解决 cordis Context 合并冲突；墨栈没有这个约束，不照搬。
- `tsconfig.build.json` 只写约定：有测试后，`tsconfig.json` 纳入测试做类型检查，build 用单独配置只 emit `src`。当前不预建。

### 10. 用 manifest 检查固化约定

`scripts/check-manifests.mjs` 增加：

- 包内存在 `tsconfig.json` 时，必须 `extends` 以 `@inkstack/tsconfig/` 开头的路径，并在 `devDependencies` 声明 `"@inkstack/tsconfig": "workspace:*"`。
- 包内存在 `src/` 时，`package.json` 必须是 `"type": "module"`。

替代方案：只靠文档约定。拒绝原因：包数量增长后，漂移无法在本地暴露。

### 11. 用临时 fixture 验证尚未有消费者的预设

- `nest`：临时类 + `@Injectable()` + 构造器注入，`tsc --noEmit` 验证装饰器与元数据选项。
- `next`：临时 `.tsx` + `process.env`，验证 `jsx: preserve`、`noEmit` 与 Node 类型同时生效。
- `react`：临时 `.tsx`，验证 DOM 与 `react-jsx`。
- `library`：由 contracts 的 `build` / `typecheck` 验证。
- fixture 验证后删除，不进入仓库。

## Risks / Trade-offs

- **TypeScript 通过 package exports 解析 `@inkstack/tsconfig/node.json` 可能因 exports 写法失败** → 用 contracts 的 `typecheck` 验证；失败时退回显式文件名路径，不保留不可用的 exports 映射。
- **Next 会改写 `apps/shell/tsconfig.json`** → 预设只提供 compilerOptions；文档说明应用级 include/paths 由 Next 管理。
- **`types: ["node"]` 让 Next 客户端文件看到 Node 全局** → 当前接受；未来按 `app/**` 与 server 路径拆分，或依赖 lint 的浏览器 override。
- **Nest 预设关闭 `strictPropertyInitialization`** → 只影响 Nest 平面；在 `docs/typescript.md` 写明理由，避免被当成全局放松。
- **contracts 改为 ESM 会改变构建产物格式** → 无外部消费者；用 `pnpm build` + `pnpm typecheck` 验证，并检查 `dist/index.js` 使用 ESM 语法。
- **新的 manifest 检查可能误伤占位包** → 只对存在 `tsconfig.json` 或 `src/` 的包生效；应用落地时再满足。
- **临时 fixture 可能被遗忘** → 验证任务要求在同一个任务内创建、运行、删除，并在最终 `git status` 检查。

## Migration Plan

1. 重命名目录与包名，更新 `exports` / `files`；运行 `pnpm install`，确认 workspace 链接重建。
2. 拆分 base 并新增 `node` / `nest` / `library` / `react` / `next` 预设。
3. 更新 contracts 的 `type`、`extends` 与 devDependency；运行 `pnpm typecheck`、`pnpm build`，确认 ESM 输出。
4. 更新 manifest 检查并运行 `pnpm check:manifests`。
5. 更新文档与 README；运行格式与 lint。
6. 回滚：把目录与包名改回，contracts 恢复 `commonjs`，重新安装；不涉及数据或运行时迁移。

## Open Questions

- 是否在未来引入 project references，取决于跨包构建时间是否成为瓶颈。
- BFF 的架构图源与 DESIGN-RECORD 更新是否与本次一起做，留给独立变更决定；本次只更新 README 的框架说明。
