# @inkstack/tsconfig

墨栈共享 TypeScript 预设。预设只包含 `compilerOptions`，消费包通过 `"extends": "@inkstack/tsconfig/<preset>.json"` 使用，并在 devDependencies 声明 `"@inkstack/tsconfig": "workspace:*"`。

| 预设           | 用途                                                 |
| -------------- | ---------------------------------------------------- |
| `base.json`    | 语言与严格性，不直接使用                             |
| `node.json`    | NodeNext + ES2024 + node types                       |
| `nest.json`    | Node 平面 + legacy decorators + decorator metadata   |
| `library.json` | Node 平面 + declaration / declarationMap / sourceMap |
| `react.json`   | bundler + DOM + react-jsx                            |
| `next.json`    | React 平面 + jsx preserve + noEmit + node types      |

## 使用

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

完整规则见 [`docs/typescript.md`](../../docs/typescript.md)。
