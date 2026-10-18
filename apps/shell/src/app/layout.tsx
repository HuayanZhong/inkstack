import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '墨栈 Inkstack',
  description: 'AI design-to-code 画布：让 AI 落笔，让代码落地。',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
