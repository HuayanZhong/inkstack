import { describe, expect, it } from 'vitest'

import { appendSearchParams, normalizeBaseUrl, resolveUrl } from '../src/url.js'

describe('normalizeBaseUrl', () => {
  it.each([
    ['https://api.example.com/', 'https://api.example.com'],
    ['https://api.example.com/bff///', 'https://api.example.com/bff'],
    ['  https://api.example.com/bff/  ', 'https://api.example.com/bff'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeBaseUrl(input)).toBe(expected)
  })

  it.each(['/api', 'api.example.com', 'ftp://api.example.com'])(
    'rejects non-absolute or non-http baseUrl %j',
    (input) => {
      expect(() => normalizeBaseUrl(input)).toThrow(TypeError)
    },
  )

  it('rejects baseUrl with query or hash', () => {
    expect(() => normalizeBaseUrl('https://api.example.com/bff?x=1')).toThrow(TypeError)
    expect(() => normalizeBaseUrl('https://api.example.com/bff#top')).toThrow(TypeError)
  })
})

describe('resolveUrl', () => {
  it.each([
    ['https://api.example.com/bff', 'users', 'https://api.example.com/bff/users'],
    ['https://api.example.com/bff/', '/users', 'https://api.example.com/bff/users'],
    ['https://api.example.com/bff', 'users/1', 'https://api.example.com/bff/users/1'],
    ['https://api.example.com', 'users', 'https://api.example.com/users'],
    ['https://api.example.com/bff', '', 'https://api.example.com/bff'],
  ])('resolves %j + %j to %j', (baseUrl, path, expected) => {
    expect(resolveUrl(baseUrl, path)).toBe(expected)
  })

  it.each(['https://evil.example.com/x', '//evil.example.com/x', '../users', 'users/../../x'])(
    'rejects escaping path %j',
    (path) => {
      expect(() => resolveUrl('https://api.example.com/bff', path)).toThrow(TypeError)
    },
  )

  it('rejects encoded traversal that resolves outside the base path', () => {
    expect(() => resolveUrl('https://api.example.com/bff', '%2e%2e/secret')).toThrow(TypeError)
  })
})

describe('appendSearchParams', () => {
  it('encodes object values and skips undefined', () => {
    expect(
      appendSearchParams('https://api.example.com/users', {
        page: 2,
        active: true,
        keyword: undefined,
      }),
    ).toBe('https://api.example.com/users?page=2&active=true')
  })

  it('merges a leading question mark and existing query', () => {
    expect(appendSearchParams('https://api.example.com/users?sort=name', '?page=2')).toBe(
      'https://api.example.com/users?sort=name&page=2',
    )
  })

  it('supports URLSearchParams and tuple arrays', () => {
    const params = new URLSearchParams({ a: '1' })
    expect(appendSearchParams('https://api.example.com/users', params)).toBe(
      'https://api.example.com/users?a=1',
    )
    expect(
      appendSearchParams('https://api.example.com/users', [
        ['a', '1'],
        ['b', 2],
      ]),
    ).toBe('https://api.example.com/users?a=1&b=2')
  })

  it('returns the URL unchanged when params are absent or empty', () => {
    expect(appendSearchParams('https://api.example.com/users')).toBe(
      'https://api.example.com/users',
    )
    expect(appendSearchParams('https://api.example.com/users', {})).toBe(
      'https://api.example.com/users',
    )
  })
})
