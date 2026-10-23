import { describe, expect, it } from 'vitest'

import { createApiClient } from '../src/client.js'
import { ApiError } from '../src/error.js'
import type { ApiClientConfig } from '../src/types.js'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('createApiClient', () => {
  it('returns independent clients for different baseUrl values', async () => {
    const urls: string[] = []
    const fetchImpl: typeof fetch = async (input, init) => {
      urls.push(new Request(input, init).url)
      return jsonResponse({})
    }

    const first = createApiClient({ baseUrl: 'https://a.example.com', fetch: fetchImpl })
    const second = createApiClient({ baseUrl: 'https://b.example.com', fetch: fetchImpl })

    await first.get('users')
    await second.get('users')

    expect(urls).toEqual(['https://a.example.com/users', 'https://b.example.com/users'])
  })

  it.each([
    ['empty baseUrl', { baseUrl: '   ' }],
    ['missing config', {}],
  ])('throws for %s', (_label, config) => {
    expect(() => createApiClient(config as ApiClientConfig)).toThrow(TypeError)
  })

  it('merges async config headers with request headers', async () => {
    let captured: Headers | undefined
    const fetchImpl: typeof fetch = async (input, init) => {
      captured = new Request(input, init).headers
      return jsonResponse({})
    }

    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: fetchImpl,
      headers: async () => ({ authorization: 'Bearer token', 'x-base': 'config' }),
    })

    await client.get('users', { headers: { 'x-base': 'request', 'x-extra': '1' } })

    expect(captured?.get('authorization')).toBe('Bearer token')
    expect(captured?.get('x-base')).toBe('request')
    expect(captured?.get('x-extra')).toBe('1')
  })
})

describe('request', () => {
  it('sends JSON and parses a JSON response', async () => {
    let captured:
      | { method: string; url: string; body: string; contentType: string | null }
      | undefined

    const fetchImpl: typeof fetch = async (input, init) => {
      const request = new Request(input, init)
      captured = {
        method: request.method,
        url: request.url,
        body: await request.clone().text(),
        contentType: request.headers.get('content-type'),
      }
      return jsonResponse({ ok: true }, 201)
    }

    const client = createApiClient({
      baseUrl: 'https://api.example.com/bff',
      fetch: fetchImpl,
    })

    const result = await client.post<{ ok: boolean }>('users', { json: { name: '墨栈' } })

    expect(result).toEqual({ ok: true })
    expect(captured).toMatchObject({
      method: 'POST',
      url: 'https://api.example.com/bff/users',
      body: JSON.stringify({ name: '墨栈' }),
    })
    expect(captured?.contentType).toContain('application/json')
  })

  it('returns text for a non-JSON response', async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response('hello', { status: 200, headers: { 'content-type': 'text/plain' } })
    const client = createApiClient({ baseUrl: 'https://api.example.com', fetch: fetchImpl })

    await expect(client.get<string>('text')).resolves.toBe('hello')
  })

  it('rejects an invalid timeout', () => {
    expect(() => createApiClient({ baseUrl: 'https://api.example.com', timeout: -1 })).toThrow(
      TypeError,
    )
  })

  it('rejects an invalid retry limit', () => {
    expect(() => createApiClient({ baseUrl: 'https://api.example.com', retry: -1 })).toThrow(
      TypeError,
    )
  })

  it('returns undefined for an empty response', async () => {
    const fetchImpl: typeof fetch = async () => new Response(null, { status: 204 })
    const client = createApiClient({ baseUrl: 'https://api.example.com', fetch: fetchImpl })

    await expect(client.get('empty')).resolves.toBeUndefined()
  })

  it('encodes query parameters and skips undefined values', async () => {
    let url = ''
    const fetchImpl: typeof fetch = async (input, init) => {
      url = new Request(input, init).url
      return jsonResponse({})
    }

    const client = createApiClient({ baseUrl: 'https://api.example.com/bff', fetch: fetchImpl })

    await client.get('users', {
      searchParams: { page: 2, active: true, keyword: undefined },
    })

    expect(url).toBe('https://api.example.com/bff/users?page=2&active=true')
  })

  it('returns the raw response from requestRaw', async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response('raw', { status: 200, headers: { 'content-type': 'text/plain' } })
    const client = createApiClient({ baseUrl: 'https://api.example.com', fetch: fetchImpl })

    const response = await client.requestRaw('file')

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe('raw')
  })

  it('keeps the original abort error instead of wrapping it', async () => {
    const fetchImpl: typeof fetch = (input, init) => {
      const signal = new Request(input, init).signal
      return new Promise<Response>((_resolve, reject) => {
        const abort = () => reject(new DOMException('Aborted', 'AbortError'))
        if (signal.aborted) {
          abort()
          return
        }
        signal.addEventListener('abort', abort, { once: true })
      })
    }

    const client = createApiClient({ baseUrl: 'https://api.example.com', fetch: fetchImpl })
    const controller = new AbortController()
    const promise = client.get('users', { signal: controller.signal })
    controller.abort()

    const error = await promise.catch((reason: unknown) => reason)

    expect(error).toMatchObject({ name: 'AbortError' })
    expect(error).not.toBeInstanceOf(ApiError)
  })
})

describe('retry', () => {
  it('does not retry by default', async () => {
    let calls = 0
    const fetchImpl: typeof fetch = async () => {
      calls += 1
      return jsonResponse({ code: 'UNAVAILABLE' }, 503)
    }

    const client = createApiClient({ baseUrl: 'https://api.example.com', fetch: fetchImpl })
    const error = await client.get('users').catch((reason: unknown) => reason)

    expect(calls).toBe(1)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 503, code: 'UNAVAILABLE' })
  })

  it('retries idempotent requests when explicitly configured', async () => {
    let calls = 0
    const fetchImpl: typeof fetch = async () => {
      calls += 1
      return calls === 1 ? jsonResponse({}, 503) : jsonResponse({ ok: true })
    }

    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: fetchImpl,
      retry: { limit: 1, delay: () => 0 },
    })

    await expect(client.get('users')).resolves.toEqual({ ok: true })
    expect(calls).toBe(2)
  })

  it('does not retry POST unless the method is explicitly allowed', async () => {
    let calls = 0
    const fetchImpl: typeof fetch = async () => {
      calls += 1
      return jsonResponse({}, 503)
    }

    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: fetchImpl,
      retry: { limit: 1, delay: () => 0 },
    })

    await expect(client.post('users', { json: {} })).rejects.toBeInstanceOf(ApiError)
    expect(calls).toBe(1)
  })

  it('retries POST when the caller adds it to the allowed methods', async () => {
    let calls = 0
    const fetchImpl: typeof fetch = async () => {
      calls += 1
      return calls === 1 ? jsonResponse({}, 503) : jsonResponse({ ok: true })
    }

    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: fetchImpl,
      retry: { limit: 1, methods: ['POST'], delay: () => 0 },
    })

    await expect(client.post('users', { json: {} })).resolves.toEqual({ ok: true })
    expect(calls).toBe(2)
  })
})
