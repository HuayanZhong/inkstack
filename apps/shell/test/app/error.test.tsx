import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ReactNode } from 'react'

import ErrorPage from '../../src/app/error'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('ErrorPage', () => {
  it('renders a retry action and a home link', () => {
    const retry = vi.fn()
    render(<ErrorPage error={new Error('boom')} retry={retry} />)

    expect(screen.getByRole('heading', { level: 1, name: '页面出错了' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '重试' }))
    expect(retry).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/')
  })

  it('does not expose the raw error message', () => {
    render(<ErrorPage error={new Error('secret-detail')} retry={vi.fn()} />)

    expect(screen.queryByText(/secret-detail/)).toBeNull()
  })
})
