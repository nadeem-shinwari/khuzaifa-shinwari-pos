/**
 * Thin HTTP client for the JSON API.
 *
 * Every backend endpoint answers with the same envelope:
 *   { success: boolean, message: string, data: mixed, errors?: object }
 *
 * The frontend only ever uses relative "/api" URLs so the built bundle stays
 * static and can be hosted next to the PHP application.
 */

const API_BASE = '/api/v1'

/** Error thrown for any non 2xx response or a failed envelope. */
export class ApiError extends Error {
  constructor(message, { status = 0, errors = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

let csrfToken = null

/**
 * Build an absolute URL for an API path.
 *
 * The path is always relative to /api/v1 so the bundle stays origin agnostic.
 */
function buildUrl(path, query) {
  const url = new URL(`${API_BASE}/${String(path).replace(/^\/+/, '')}`, window.location.origin)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url
}

/** Read a cookie value by name. */
function readCookie(name) {
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'))

  return match ? decodeURIComponent(match[2]) : ''
}

/**
 * Fetch a CSRF token once and cache it for later state changing requests.
 */
export async function getCsrfToken(force = false) {
  if (!force && csrfToken) {
    return csrfToken
  }

  const response = await fetch(buildUrl('system/csrf'), {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message || 'Unable to obtain a CSRF token', {
      status: response.status,
    })
  }

  csrfToken = payload.data?.token ?? readCookie('csrf_token')

  return csrfToken
}

/** Forget the cached CSRF token (used after a session change). */
export function resetCsrfToken() {
  csrfToken = null
}

/** Store a CSRF token returned by the API (used after login/logout). */
export function setCsrfToken(token) {
  csrfToken = token || null
}

/**
 * Perform an API request and unwrap the envelope.
 *
 * @param {string} path   Path relative to /api/v1, e.g. "system/health"
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {object} [options.body]     JSON body
 * @param {object} [options.query]    Query string parameters
 * @param {boolean} [options.csrf]    Send the CSRF token (default: state changing verbs)
 */
export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, query, csrf } = options

  const url = buildUrl(path, query)

  const headers = { Accept: 'application/json' }
  const verb = method.toUpperCase()
  const needsCsrf = csrf ?? !['GET', 'HEAD', 'OPTIONS'].includes(verb)

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (needsCsrf) {
    const token = await getCsrfToken()

    if (token) {
      headers['X-CSRF-Token'] = token
    }
  }

  const response = await fetch(url.toString(), {
    method: verb,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(payload?.message || `Request failed with status ${response.status}`, {
      status: response.status,
      errors: payload?.errors ?? null,
    })
  }

  if (!payload?.success) {
    throw new ApiError(payload?.message || 'Request failed', {
      status: response.status,
      errors: payload?.errors ?? null,
    })
  }

  return payload.data
}

/** Convenience wrapper for GET requests. */
export function apiGet(path, query) {
  return apiRequest(path, { method: 'GET', query })
}

/** Convenience wrapper for POST requests. */
export function apiPost(path, body) {
  return apiRequest(path, { method: 'POST', body })
}
