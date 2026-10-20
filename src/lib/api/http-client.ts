import type { z } from 'zod'

/**
 * Framework-agnostic typed wrapper around native fetch.
 * Safe to import from server and client code: it holds no configuration or secrets.
 * For calls to the private backend use `backendRequest` (src/lib/api/backend.ts).
 */

export type ApiErrorCode =
  'HTTP_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'NOT_FOUND' | 'VALIDATION_ERROR'

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details?: unknown

  constructor(
    message: string,
    options: { status: number; code: ApiErrorCode; details?: unknown; cause?: unknown },
  ) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.details = options.details
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type QueryParams = Record<string, string | number | boolean | null | undefined>

export type HttpRequestOptions<T> = {
  method?: HttpMethod
  query?: QueryParams
  /** Serialized as JSON. */
  body?: unknown
  headers?: HeadersInit
  /** Validates the JSON response. Strongly recommended for data from external systems. */
  schema?: z.ZodType<T>
  /** Caller-controlled cancellation (e.g. component unmount). */
  signal?: AbortSignal
  timeoutMs?: number
  /** Passed through to fetch (Next.js `cache`, `next: { tags }`, credentials, ...). */
  init?: Omit<RequestInit, 'method' | 'body' | 'headers' | 'signal'>
}

const DEFAULT_TIMEOUT_MS = 10_000

export function buildUrl(baseUrl: string, path: string, query?: QueryParams): URL {
  // Keep any path prefix on the base URL (https://host/api/v1 + /orders -> /api/v1/orders).
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '')
      url.searchParams.set(key, String(value))
  }
  return url
}

/** Pulls a human-readable message out of common error body shapes (RFC 7807, {message}, {error}). */
function errorMessageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    for (const key of ['detail', 'message', 'error', 'title']) {
      if (typeof record[key] === 'string' && record[key]) return record[key]
    }
  }
  return fallback
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    // skip: non-JSON body (HTML error page, plain text); return it raw for error details
    return text
  }
}

function codeForStatus(status: number): ApiErrorCode {
  if (status === 404) return 'NOT_FOUND'
  if (status === 400 || status === 422) return 'VALIDATION_ERROR'
  return 'HTTP_ERROR'
}

export async function httpRequest<T = unknown>(
  url: URL | string,
  options: HttpRequestOptions<T> = {},
): Promise<T> {
  const { method = 'GET', body, schema, signal, timeoutMs = DEFAULT_TIMEOUT_MS, init } = options
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (body !== undefined) headers.set('Content-Type', 'application/json')

  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: combinedSignal,
    })
  } catch (error) {
    if (timeoutSignal.aborted) {
      throw new ApiError(`Request timed out after ${timeoutMs} ms`, {
        status: 0,
        code: 'TIMEOUT',
        cause: error,
      })
    }
    // Caller cancelled: rethrow the AbortError untouched so callers can ignore it.
    if (signal?.aborted) throw error
    throw new ApiError('Network error: could not reach the server', {
      status: 0,
      code: 'NETWORK_ERROR',
      cause: error,
    })
  }

  const data = await readBody(response)

  if (!response.ok) {
    throw new ApiError(errorMessageFrom(data, `Request failed with status ${response.status}`), {
      status: response.status,
      code: codeForStatus(response.status),
      details: data,
    })
  }

  if (!schema) return data as T

  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new ApiError('Unexpected response format from server', {
      status: response.status,
      code: 'INVALID_RESPONSE',
      details: parsed.error.issues,
    })
  }
  return parsed.data
}
