import { NetworkError, TimeoutError } from 'ky'
import { describe, expect, it } from 'vitest'

import { createApiClient } from '../src/client.js'
import { ApiError, normalizeTransportError } from '../src/error.js'

describe('normalizeTransportError', () => {
  it('maps HTTP errors with body code and requestId', () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () =>
        new Response(JSON.stringify({ code: 'BAD_REQUEST', requestId: 'req-1' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
    })

    return client.get('users').catch((error: unknown) => {
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({
        status: 400,
        code: 'BAD_REQUEST',
        requestId: 'req-1',
        data: { code: 'BAD_REQUEST', requestId: 'req-1' },
      })
    })
  })

  it('falls back to the configured response header for requestId', () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      requestIdHeader: 'x-trace-id',
      fetch: async () =>
        new Response('{}', {
          status: 500,
          headers: { 'content-type': 'application/json', 'x-trace-id': 'trace-1' },
        }),
    })

    return client.get('users').catch((error: unknown) => {
      expect(error).toMatchObject({ status: 500, code: 'HTTP_ERROR', requestId: 'trace-1' })
    })
  })

  it('maps timeout errors', () => {
    const timeout = new TimeoutError(new Request('https://api.example.com/users'))
    const error = normalizeTransportError(timeout, 'x-request-id')

    expect(error).toMatchObject({ status: null, code: 'TIMEOUT' })
    expect(error.cause).toBe(timeout)
  })

  it('maps network errors', () => {
    const network = new NetworkError(new Request('https://api.example.com/users'), {
      cause: new Error('offline'),
    })
    const error = normalizeTransportError(network, 'x-request-id')

    expect(error).toMatchObject({ status: null, code: 'NETWORK_ERROR' })
    expect(error.cause).toBe(network)
  })

  it('rethrows abort errors unchanged', () => {
    const abort = new DOMException('Aborted', 'AbortError')

    try {
      normalizeTransportError(abort, 'x-request-id')
      expect.unreachable('expected abort to be rethrown')
    } catch (error) {
      expect(error).toBe(abort)
    }
  })

  it('rethrows unknown errors unchanged', () => {
    const bug = new Error('programming bug')

    try {
      normalizeTransportError(bug, 'x-request-id')
      expect.unreachable('expected unknown error to be rethrown')
    } catch (error) {
      expect(error).toBe(bug)
    }
  })
})
