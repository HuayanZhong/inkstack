export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-5 px-6 py-16">
      <p className="font-mono text-xs tracking-[0.24em] text-muted-foreground uppercase">
        Inkstack
      </p>
      <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">墨栈</h1>
      <p className="max-w-lg text-sm leading-7 text-muted-foreground">
        AI design-to-code 画布。项目处于骨架阶段：画布、登录与设计转代码流程尚未接入页面。
      </p>
    </main>
  )
}
