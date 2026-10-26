import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ReactNode } from 'react'

import NotFound, { metadata } from '../../src/app/not-found'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('NotFound', () => {
  it('renders the 404 message and a home link', () => {
    render(<NotFound />)

    expect(screen.getByRole('heading', { level: 1, name: '页面不存在' })).toBeInTheDocument()
    expect(screen.getByText('你访问的地址没有对应页面，或者它已经被移除。')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/')
  })

  it('does not expose internal error details', () => {
    const { container } = render(<NotFound />)

    expect(container.querySelector('pre')).toBeNull()
    expect(container.textContent).not.toContain('Error:')
    expect(container.textContent).not.toContain('.tsx')
  })

  it('does not repeat the product name in the page title', () => {
    expect(metadata.title).toBe('页面不存在')
  })
})
