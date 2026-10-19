# TypeScript 配置

本文是 tsconfig 预设、模块格式与构建约定的唯一 home。format / lint / Turbo 环境变量检查见 [`docs/toolchain.md`](toolchain.md)。

## 预设结构

```
base.json            语言与严格性，不直接使用
├── node.json        NodeNext + ES2024 + node types
│   ├── nest.json    + legacy decorators + decorator metadata
│   └── library.json + declaration / declarationMap / sourceMap
└── react.json       bundler + DOM + react-jsx
    └── next.json    + jsx preserve + noEmit + node types
```

消费方式：

```json
{
  "extends": "@inkstack/tsconfig/node.json"
}
```

## 包与预设

| 包                   | 预设           | 说明                              |
| -------------------- | -------------- | --------------------------------- |
| `packages/config`    | `library.json` | ESM 输出，带声明文件              |
| `packages/contracts` | `library.json` | ESM 输出，带声明文件              |
| `packages/ai-*`      | `node.json`    | 纯 Node ESM                       |
| `apps/gateway`       | `nest.json`    | Nest 装饰器与 DI                  |
| `apps/bff`           | `nest.json`    | Nest 装饰器与 DI                  |
| `apps/shell`         | `next.json`    | Next 会接管应用级 include / paths |
| `apps/canvas`        | `react.json`   | 浏览器环境，`types: []`           |

新增应用在首个源码文件落地时创建应用级 `tsconfig.json`；预设本身不提供。

## 规则

- **预设只放 `compilerOptions`**。`include`、`exclude`、`rootDir`、`outDir`、`paths` 留在包内。`extends` 中的相对路径按预设文件目录解析，放进预设会指向 `packages/tsconfig`。
- **不要直接继承 `base.json`**。按平面选择 `node` / `nest` / `library` / `react` / `next`；`base` 不声明 `module` 与 `moduleResolution`。
- **所有代码包使用 ESM**。有 `src/` 的包必须是 `"type": "module"`；`node` / `nest` / `library` 使用 NodeNext，相对导入必须写 `.js` 扩展名。
- **`nest.json` 关闭 `strictPropertyInitialization`**。Nest 的构造器注入与 DTO 在该选项下噪音过大；这是 Nest 平面专属取舍，不影响其他平面。
- **`next.json` 不设置 `include` / `exclude`**。Next 会改写 `apps/shell/tsconfig.json` 并加入 `next-env.d.ts`、`.next/types/**`；应用负责 `paths` 与 `include`。
- **`next.json` 使用 `types: ["node"]`**。服务端代码需要 `process` 等全局类型；代价是客户端文件也能看到 Node 全局，当前接受。
- **Next 应用在应用级关闭 `noUnusedLocals` / `noUnusedParameters`**（见 `apps/shell/tsconfig.json`）。Next 生成的 `.next/**/validator.ts` 自带未使用的导入与类型别名，开启后 `typecheck` 会在跑过 `dev` 之后失败；未使用检查由 oxlint 的 `no-unused-vars` 承担。
- **Next 应用把 `tsBuildInfoFile` 指向 `.next/cache/`**，避免增量类型检查的缓存文件落在应用根目录。
- **`library.json` 只负责声明文件与 sourcemap**。暂不设置 `composite`；project references 等跨包 `tsc -b` 有真实收益时再引入。
- **测试与构建分文件**。`tsconfig.json` 纳入测试做类型检查，`tsconfig.build.json` 排除 `*.test.ts` 只 emit 源码；接入步骤见 [`docs/testing.md`](testing.md)。
- **不引入根 solution tsconfig**。Turborepo 按包执行 `typecheck` / `build`；跨包顺序由 `dependsOn: ["^build"]` 保证。

## 新增包时的模板

```json
{
  "extends": "@inkstack/tsconfig/node.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

并在 `package.json` 声明：

```json
{
  "devDependencies": {
    "@inkstack/tsconfig": "workspace:*"
  }
}
```

`pnpm check:manifests` 会检查这两项是否同时存在，以及 `extends` 是否指向已导出的预设。

## 验证

```bash
pnpm typecheck
pnpm build
pnpm check:manifests
```

`nest` / `next` / `react` / `library` 当前都有消费者；新增无消费者的预设时，用临时 fixture 继承并运行 `tsc --noEmit` 验证，fixture 不提交仓库。
