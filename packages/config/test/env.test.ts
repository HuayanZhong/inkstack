import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  EnvError,
  envBoolString,
  envIntString,
  envNonNegativeIntString,
  envString,
  envUrlString,
  parseEnv,
} from '../src/env.js'

describe('parseEnv', () => {
  it('returns parsed data with defaults applied', () => {
    const schema = z.object({
      PORT: envIntString().default(4003),
      NAME: envString(),
    })

    const result = parseEnv(schema, { NAME: 'inkstack' })

    expect(result).toEqual({ PORT: 4003, NAME: 'inkstack' })
    expect(typeof result.PORT).toBe('number')
  })

  it('throws EnvError with the failing path and label for one invalid field', () => {
    const schema = z.object({ BFF_PORT: envIntString() })

    expect(() => parseEnv(schema, { BFF_PORT: 'abc' }, { label: 'bff' })).toThrow(EnvError)

    try {
      parseEnv(schema, { BFF_PORT: 'abc' }, { label: 'bff' })
    } catch (error) {
      expect(error).toBeInstanceOf(EnvError)
      const envError = error as EnvError
      expect(envError.name).toBe('EnvError')
      expect(envError.message).toContain('bff')
      expect(envError.message).toContain('BFF_PORT')
      expect(envError.issues).toEqual([{ path: 'BFF_PORT', message: expect.any(String) }])
    }
  })

  it('reports every failing field in one error', () => {
    const schema = z.object({
      NAME: envString(),
      PORT: envIntString(),
      ENABLED: envBoolString(),
    })

    try {
      parseEnv(schema, { NAME: '', PORT: 'abc', ENABLED: 'yes' })
    } catch (error) {
      expect(error).toBeInstanceOf(EnvError)
      const paths = (error as EnvError).issues.map((issue) => issue.path).sort()
      expect(paths).toEqual(['ENABLED', 'NAME', 'PORT'])
    }
  })
})

describe('envString', () => {
  it('accepts a non-empty string', () => {
    expect(envString().parse('inkstack')).toBe('inkstack')
  })

  it('rejects an empty string and a missing value', () => {
    expect(envString().safeParse('').success).toBe(false)
    expect(envString().safeParse(undefined).success).toBe(false)
  })
})

describe('envUrlString', () => {
  it('accepts an absolute URL', () => {
    expect(envUrlString().parse('http://localhost:4002/mf-manifest.json')).toBe(
      'http://localhost:4002/mf-manifest.json',
    )
  })

  it('rejects a value that is not a URL', () => {
    expect(envUrlString().safeParse('not a url').success).toBe(false)
    expect(envUrlString().safeParse('http://').success).toBe(false)
    expect(envUrlString().safeParse('').success).toBe(false)
  })
})

describe('envIntString', () => {
  it('coerces a numeric string to a positive integer', () => {
    expect(envIntString().parse('4001')).toBe(4001)
  })

  it('rejects zero, negative, fractional, and non-numeric values', () => {
    for (const value of ['0', '-1', '1.5', 'abc', '']) {
      expect(envIntString().safeParse(value).success, value).toBe(false)
    }
  })
})

describe('envNonNegativeIntString', () => {
  it('accepts zero', () => {
    expect(envNonNegativeIntString().parse('0')).toBe(0)
  })

  it('rejects a negative value', () => {
    expect(envNonNegativeIntString().safeParse('-1').success).toBe(false)
  })
})

describe('envBoolString', () => {
  it.each([
    ['true', true],
    ['1', true],
    ['false', false],
    ['0', false],
  ])('parses %s as %s', (value, expected) => {
    expect(envBoolString().parse(value)).toBe(expected)
  })

  it('rejects values outside the fixed literal set', () => {
    for (const value of ['yes', 'TRUE', '', 'on']) {
      expect(envBoolString().safeParse(value).success, value).toBe(false)
    }
  })
})
