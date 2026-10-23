import { describe, expect, it } from 'vitest'

import { createApiClient } from '../src/client.js'
import { ApiError } from '../src/error.js'

const encoder = new TextEncoder()

function eventResponse(chunks: string[]): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  })
}

function failingResponse(chunks: string[], error: Error): Response {
  let index = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]))
        index += 1
        return
      }
      controller.error(error)
    },
  })

  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  })
}

function openResponse(): { response: Response; close: () => void } {
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | undefined
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller
      controller.enqueue(encoder.encode('data: one\n\n'))
    },
  })

  return {
    response: new Response(stream, {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    }),
    close: () => controllerRef?.close(),
  }
}

async function collect<T>(stream: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = []
  for await (const item of stream) items.push(item)
  return items
}

describe('stream', () => {
  it('yields parsed events in order', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () =>
        eventResponse(['event: message\nid: 1\ndata: hello\n\n', 'data: world\n\n']),
    })

    const events = await collect(client.stream('events'))

    expect(events).toEqual([{ event: 'message', id: '1', data: 'hello' }, { data: 'world' }])
  })

  it('sends POST JSON when a json body is provided', async () => {
    let captured:
      | { method: string; body: string; contentType: string | null; accept: string | null }
      | undefined

    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async (input, init) => {
        const request = new Request(input, init)
        captured = {
          method: request.method,
          body: await request.clone().text(),
          contentType: request.headers.get('content-type'),
          accept: request.headers.get('accept'),
        }
        return eventResponse(['data: ok\n\n'])
      },
    })

    await collect(client.stream('chat', { json: { message: 'hi' } }))

    expect(captured).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ message: 'hi' }),
    })
    expect(captured?.contentType).toContain('application/json')
    expect(captured?.accept).toBe('text/event-stream')
  })

  it('maps a non-2xx response to ApiError', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () =>
        new Response(JSON.stringify({ code: 'UNAUTHORIZED', requestId: 'req-1' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
    })

    const error = await collect(client.stream('events')).catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      requestId: 'req-1',
    })
  })

  it('maps a response without body to EMPTY_STREAM', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () => new Response(null, { status: 200 }),
    })

    const error = await collect(client.stream('events')).catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'EMPTY_STREAM' })
  })

  it('does not retry a parse failure', async () => {
    let calls = 0
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () => {
        calls += 1
        return eventResponse(['data: bad\n\n'])
      },
    })

    const error = await collect(
      client.stream('events', {
        parse: () => {
          throw new Error('bad event')
        },
        reconnect: { maxAttempts: 3, initialDelayMs: 0 },
      }),
    ).catch((reason: unknown) => reason)

    expect(calls).toBe(1)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'SSE_PARSE_ERROR' })
  })

  it.each([{ maxAttempts: -1 }, { initialDelayMs: -1 }, { maxDelayMs: -1 }])(
    'rejects invalid reconnect options %j',
    (reconnect) => {
      const client = createApiClient({
        baseUrl: 'https://api.example.com',
        fetch: async () => eventResponse([]),
      })

      expect(() => client.stream('events', { reconnect })).toThrow(TypeError)
    },
  )

  it('ends cleanly when aborted', async () => {
    const { response } = openResponse()
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () => response,
    })

    const controller = new AbortController()
    const stream = client.stream('events', { signal: controller.signal })
    const iterator = stream[Symbol.asyncIterator]()

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: { data: 'one' },
    })

    const pending = iterator.next()
    controller.abort()

    await expect(pending).resolves.toEqual({ done: true, value: undefined })
  })

  it('does not connect when closed before iteration', async () => {
    let calls = 0
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () => {
        calls += 1
        return eventResponse([])
      },
    })

    const stream = client.stream('events')
    stream.close()

    await expect(collect(stream)).resolves.toEqual([])
    expect(calls).toBe(0)
  })

  it('uses the parse function for event data', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () => eventResponse(['data: {"text":"hi"}\n\n']),
    })

    const events = await collect(
      client.stream<{ text: string }>('events', {
        parse: (data) => JSON.parse(data) as { text: string },
      }),
    )

    expect(events).toEqual([{ data: { text: 'hi' } }])
  })
})

describe('stream reconnect', () => {
  it('does not reconnect by default', async () => {
    let calls = 0
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () => {
        calls += 1
        return failingResponse(['data: one\n\n'], new Error('drop'))
      },
    })

    const error = await collect(client.stream('events')).catch((reason: unknown) => reason)

    expect(calls).toBe(1)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it('reconnects with Last-Event-ID when enabled', async () => {
    let calls = 0
    const headers: Headers[] = []

    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async (input, init) => {
        calls += 1
        headers.push(new Request(input, init).headers)
        return calls === 1
          ? failingResponse(['id: 1\ndata: one\n\n'], new Error('drop'))
          : eventResponse(['id: 2\ndata: two\n\n'])
      },
    })

    const events = await collect(
      client.stream('events', { reconnect: { maxAttempts: 1, initialDelayMs: 0 } }),
    )

    expect(calls).toBe(2)
    expect(headers[1]?.get('last-event-id')).toBe('1')
    expect(events.map((event) => event.data)).toEqual(['one', 'two'])
  })

  it('stops after the configured reconnect attempts', async () => {
    let calls = 0
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () => {
        calls += 1
        return failingResponse([], new Error('drop'))
      },
    })

    const error = await collect(
      client.stream('events', { reconnect: { maxAttempts: 1, initialDelayMs: 0 } }),
    ).catch((reason: unknown) => reason)

    expect(calls).toBe(2)
    expect(error).toBeInstanceOf(ApiError)
  })

  it('skips a replayed event with the same id', async () => {
    let calls = 0
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () => {
        calls += 1
        return calls === 1
          ? failingResponse(['id: 1\ndata: one\n\n'], new Error('drop'))
          : eventResponse(['id: 1\ndata: one-again\n\n', 'id: 2\ndata: two\n\n'])
      },
    })

    const events = await collect(
      client.stream('events', { reconnect: { maxAttempts: 1, initialDelayMs: 0 } }),
    )

    expect(events.map((event) => event.data)).toEqual(['one', 'two'])
  })

  it('uses Retry-After for a retryable handshake failure', async () => {
    let calls = 0
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () => {
        calls += 1
        return calls === 1
          ? new Response('{}', {
              status: 503,
              headers: { 'content-type': 'application/json', 'retry-after': '0' },
            })
          : eventResponse(['data: ok\n\n'])
      },
    })

    const events = await collect(
      client.stream('events', { reconnect: { maxAttempts: 1, initialDelayMs: 0 } }),
    )

    expect(calls).toBe(2)
    expect(events).toEqual([{ data: 'ok' }])
  })

  it('does not reconnect after a clean end of stream', async () => {
    let calls = 0
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetch: async () => {
        calls += 1
        return eventResponse(['data: done\n\n'])
      },
    })

    const events = await collect(
      client.stream('events', { reconnect: { maxAttempts: 3, initialDelayMs: 0 } }),
    )

    expect(calls).toBe(1)
    expect(events).toEqual([{ data: 'done' }])
  })
})
