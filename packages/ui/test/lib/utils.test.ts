import { describe, expect, it } from 'vitest'

import { cn } from '@inkstack/ui/lib/utils'

describe('cn', () => {
  it('joins class names and drops falsy values', () => {
    expect(cn('px-2', undefined, 'py-1')).toBe('px-2 py-1')
  })
})
