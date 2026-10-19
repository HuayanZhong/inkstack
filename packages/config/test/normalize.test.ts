import { describe, expect, it } from 'vitest'

import { joinUrl, normalizeBaseUrl, normalizePrefix } from '../src/normalize.js'

describe('normalizePrefix', () => {
  it.each([
    ['', '/'],
    ['/', '/'],
    ['api', '/api'],
    ['/api/', '/api'],
    ['api/', '/api'],
    ['  /api/  ', '/api'],
    ['/api///', '/api'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizePrefix(input)).toBe(expected)
  })
})

describe('normalizeBaseUrl', () => {
  it.each([
    ['http://localhost:4002/', 'http://localhost:4002'],
    ['http://localhost:4002///', 'http://localhost:4002'],
    ['  http://localhost:4002/  ', 'http://localhost:4002'],
    ['', ''],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeBaseUrl(input)).toBe(expected)
  })
})

describe('joinUrl', () => {
  it.each([
    ['', '/api', '/api'],
    ['http://localhost:4002', '', 'http://localhost:4002'],
    ['http://localhost:4002', '/', 'http://localhost:4002'],
    ['http://localhost:4002/', '/api', 'http://localhost:4002/api'],
    ['http://localhost:4002', 'api', 'http://localhost:4002/api'],
    ['http://localhost:4002/', 'api', 'http://localhost:4002/api'],
    ['  http://localhost:4002/  ', '  /api  ', 'http://localhost:4002/api'],
    ['', '', ''],
  ])('joins %j and %j to %j', (baseUrl, path, expected) => {
    expect(joinUrl(baseUrl, path)).toBe(expected)
  })
})
