import { appConfig } from '../config/app.config.js'

/**
 * apiClient — EMPTY fetch wrapper / seam for a future backend.
 * No endpoints are defined yet (framework scaffolding only).
 *
 * When a real API arrives:
 *   1. set VITE_DATA_SOURCE=api and VITE_API_BASE_URL in .env
 *   2. call apiClient.get('/inventory') etc. from pages or services
 * Pages never talk to fetch directly — this wrapper is the single seam.
 */

export class ApiError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status ?? 0
    this.cause = cause
  }
}

const DEFAULT_TIMEOUT_MS = 15000

export const isApiEnabled = () => appConfig.dataSource === 'api'

async function request(path, { method = 'GET', headers, body, timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = {}) {
  if (!isApiEnabled()) {
    throw new ApiError(
      `API is disabled (VITE_DATA_SOURCE='${appConfig.dataSource}'). Set VITE_DATA_SOURCE=api in .env to enable.`
    )
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      ...rest,
    })

    if (!response.ok) {
      throw new ApiError(`Request failed: ${method} ${path}`, { status: response.status })
    }
    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error?.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${timeoutMs}ms: ${method} ${path}`, { cause: error })
    }
    throw new ApiError(`Network error: ${method} ${path}`, { cause: error })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}

export default apiClient
