import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ReactNode } from 'react'

import LoginPage, { metadata } from '../../../../src/app/(auth)/login/page'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('LoginPage', () => {
  it('renders the login form with accessible credentials', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { level: 1, name: '回到墨栈' })).toBeInTheDocument()

    const email = screen.getByLabelText('邮箱')
    expect(email).toHaveAttribute('type', 'email')
    expect(email).toHaveAttribute('autocomplete', 'email')

    const password = screen.getByLabelText('密码')
    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveAttribute('autocomplete', 'current-password')
  })

  it('keeps the submit disabled and explains the static stage', () => {
    render(<LoginPage />)

    expect(screen.getByRole('button', { name: '登录' })).toBeDisabled()
    expect(screen.getByText('登录尚未接入，当前仅展示样式与布局。')).toBeInTheDocument()
  })

  it('links only to the implemented register page', () => {
    render(<LoginPage />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/register')
  })

  it('declares the page title', () => {
    expect(metadata.title).toBe('登录')
  })
})
