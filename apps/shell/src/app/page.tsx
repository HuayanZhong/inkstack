const capabilities = [
  {
    title: 'AI 控笔',
    description: '用自然语言描述意图，让 Agent 在画布上完成形状、布局与细节调整。',
  },
  {
    title: '人工编辑',
    description: '保留完整的画布编辑能力，AI 的每一次改动都可以被接管、微调或撤销。',
  },
  {
    title: '设计转代码',
    description: '由确定性编译器把设计稿转成可运行代码，而不是让模型自由发挥。',
  },
]

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-sm font-medium tracking-tight">墨栈 Inkstack</span>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          骨架阶段
        </span>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-12 px-6 py-16 sm:px-10">
        <div className="max-w-2xl space-y-5">
          <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
            AI design-to-code canvas
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            让 AI 落笔，让代码落地
          </h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            在画布上与 AI 共同设计，把每一次控件修改沉淀为可运行的代码。
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-3">
          {capabilities.map((capability) => (
            <li key={capability.title} className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-medium">{capability.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {capability.description}
              </p>
            </li>
          ))}
        </ul>

        <p className="text-sm text-muted-foreground">登录与画布入口正在搭建中。</p>
      </section>
    </main>
  )
}
