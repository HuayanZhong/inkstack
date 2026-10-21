import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from '@inkstack/ui'

describe('Button', () => {
  it('renders the provided label', () => {
    render(<Button>保存</Button>)

    const button = screen.getByRole('button', { name: '保存' })
    expect(button.textContent).toBe('保存')
    expect(button.className).toContain('bg-primary')
  })

  it('applies variant and size classes', () => {
    render(
      <Button variant="outline" size="sm">
        取消
      </Button>,
    )

    const button = screen.getByRole('button', { name: '取消' })
    expect(button.className).toContain('border-border')
    expect(button.className).toContain('h-7')
  })
})
