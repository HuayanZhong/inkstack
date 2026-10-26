import type { Metadata } from 'next'

import { ThemeProvider } from '@inkstack/ui'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '墨栈 Inkstack',
    template: '%s · 墨栈 Inkstack',
  },
  description: 'AI design-to-code 画布：让 AI 落笔，让代码落地。',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
