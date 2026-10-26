import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Input } from '@inkstack/ui'

afterEach(cleanup)

describe('Input', () => {
  it('keeps type and autocomplete semantics', () => {
    render(
      <>
        <label htmlFor="email">邮箱</label>
        <Input id="email" type="email" autoComplete="email" />
      </>,
    )

    const input = screen.getByLabelText('邮箱')
    expect(input.getAttribute('type')).toBe('email')
    expect(input.getAttribute('autocomplete')).toBe('email')
    expect(input.getAttribute('data-slot')).toBe('input')
  })

  it('supports disabled state and custom classes', () => {
    render(<Input aria-label="密码" type="password" disabled className="rounded-none" />)

    const input = screen.getByLabelText('密码') as HTMLInputElement
    expect(input.disabled).toBe(true)
    expect(input.className).toContain('rounded-none')
    expect(input.className).toContain('border-input')
  })
})
