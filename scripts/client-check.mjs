/**
 * Smoke check for the real API client.
 *
 * Imports src/services/api.js unmodified and exercises it against the running
 * PHP server: envelope unwrapping, error mapping and the CSRF handshake.
 *
 *   php -S 127.0.0.1:8000 backend/server-router.php
 *   node scripts/client-check.mjs
 */
const ORIGIN = process.env.API_ORIGIN ?? 'http://127.0.0.1:8000'

// Minimal browser stubs so the client module can run under Node.
globalThis.window = {
  location: { origin: ORIGIN },
}

globalThis.document = {
  get cookie() {
    return ''
  },
  set cookie(value) {
    cookies.push(String(value))
  },
}

const cookies = []

const { apiGet, apiRequest, getCsrfToken, ApiError } = await import('../src/services/api.js')

let failures = 0

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`OK  ${label}`)
  } else {
    failures += 1
    console.error(`FAIL ${label}${detail ? ` -> ${detail}` : ''}`)
  }
}

// 1. A successful request returns the unwrapped "data" payload.
const health = await apiGet('system/health')
check('apiGet unwraps the envelope', health?.status === 'ok', JSON.stringify(health))
check('health exposes the database block', typeof health?.database?.reachable === 'boolean')

// 2. A query string is forwarded.
const info = await apiGet('system/info', { unused: 'ignored' })
check('apiGet returns the info payload', info?.api_version === 'v1', JSON.stringify(info))

// 3. A CSRF token can be obtained and cached.
const token = await getCsrfToken()
check('getCsrfToken returns a token', typeof token === 'string' && token.length > 0)
const cached = await getCsrfToken()
check('getCsrfToken caches the token', cached === token)

// 4. A missing endpoint throws an ApiError with the status code.
try {
  await apiRequest('system/does-not-exist')
  check('unknown route throws ApiError', false, 'no error was thrown')
} catch (error) {
  check(
    'unknown route throws ApiError',
    error instanceof ApiError && error.status === 404,
    `status=${error.status}`,
  )
}

// 5. An unsupported method is reported as 405.
try {
  await apiRequest('system/health', { method: 'DELETE' })
  check('unsupported method throws ApiError', false, 'no error was thrown')
} catch (error) {
  check(
    'unsupported method throws ApiError',
    error instanceof ApiError && error.status === 405,
    `status=${error.status}`,
  )
}

if (failures > 0) {
  console.error(`\n${failures} client check(s) failed.`)
  process.exit(1)
}

console.log('\nThe API client behaves as expected.')
