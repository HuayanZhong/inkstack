import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ReactNode } from 'react'

import Home from '../../src/app/page'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('Home', () => {
  it('renders the product name and stage notice', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { level: 1, name: '墨栈' })).toBeInTheDocument()
    expect(screen.getByText('Inkstack')).toBeInTheDocument()
    expect(screen.getByText(/登录页已就绪/)).toBeInTheDocument()
  })

  it('links only to the implemented auth pages', () => {
    render(<Home />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/login', '/register'])
  })
})
