import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ReactNode } from 'react'

import RegisterPage, { metadata } from '../../../../src/app/(auth)/register/page'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('RegisterPage', () => {
  it('renders the register form with accessible credentials', () => {
    const { container } = render(<RegisterPage />)

    expect(screen.getByRole('heading', { level: 1, name: '创建账号' })).toBeInTheDocument()

    const email = screen.getByLabelText('邮箱')
    expect(email).toHaveAttribute('type', 'email')
    expect(email).toHaveAttribute('autocomplete', 'email')

    const password = screen.getByLabelText('密码')
    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveAttribute('autocomplete', 'new-password')

    expect(container.querySelectorAll('input')).toHaveLength(2)
    expect(screen.queryByLabelText('确认密码')).toBeNull()
  })

  it('keeps the submit disabled and explains the static stage', () => {
    render(<RegisterPage />)

    expect(screen.getByRole('button', { name: '创建账号' })).toBeDisabled()
    expect(screen.getByText('注册尚未接入，当前仅展示样式与布局。')).toBeInTheDocument()
  })

  it('links only to the implemented login page', () => {
    render(<RegisterPage />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/login')
  })

  it('declares the page title', () => {
    expect(metadata.title).toBe('注册')
  })
})
