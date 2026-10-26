import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Input, Label } from '@inkstack/ui'

afterEach(cleanup)

describe('Label', () => {
  it('associates with the control through htmlFor', () => {
    render(
      <>
        <Label htmlFor="email">邮箱</Label>
        <Input id="email" />
      </>,
    )

    expect(screen.getByText('邮箱').getAttribute('for')).toBe('email')
    expect(screen.getByLabelText('邮箱').getAttribute('id')).toBe('email')
  })

  it('keeps the label slot and custom classes', () => {
    render(<Label className="text-muted-foreground">密码</Label>)

    const label = screen.getByText('密码')
    expect(label.getAttribute('data-slot')).toBe('label')
    expect(label.className).toContain('text-muted-foreground')
  })
})
