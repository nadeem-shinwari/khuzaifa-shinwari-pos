/**
 * Authentication flow check against the running API.
 *
 *   php -S 127.0.0.1:8000 backend/server-router.php
 *   node scripts/auth-check.mjs
 */
const ORIGIN = process.env.API_ORIGIN ?? 'http://127.0.0.1:8000'
const API = `${ORIGIN}/api/v1`

const EMAIL = process.env.ADMIN_EMAIL ?? 'admin@khuzaifa.test'
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'Secret123'

let failures = 0
let jar = ''

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`OK  ${label}`)
  } else {
    failures += 1
    console.error(`FAIL ${label}${detail ? ` -> ${detail}` : ''}`)
  }
}

function cookieHeader(response) {
  const raw = response.headers.getSetCookie?.() ?? []
  const parts = []

  for (const entry of raw) {
    const [pair] = entry.split(';')
    parts.push(pair.trim())
  }

  if (parts.length > 0) {
    jar = parts.join('; ')
  }

  return jar
}

async function request(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers ?? {}) }

  if (jar) {
    headers.Cookie = jar
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  cookieHeader(response)

  const payload = await response.json().catch(() => null)

  return { response, payload }
}

// 1. A CSRF token can be fetched before signing in.
const csrf = await request('/system/csrf')
check('csrf endpoint returns a token', typeof csrf.payload?.data?.token === 'string', JSON.stringify(csrf.payload))
const token = csrf.payload?.data?.token

// 2. A login without the CSRF token is rejected.
const noToken = await request('/auth/login', {
  method: 'POST',
  body: { email: EMAIL, password: PASSWORD },
})
check('login without a CSRF token is rejected', noToken.response.status === 419, `status=${noToken.response.status}`)

// 3. A login with a wrong password is rejected.
const wrong = await request('/auth/login', {
  method: 'POST',
  headers: { 'X-CSRF-Token': token },
  body: { email: EMAIL, password: 'WrongPassword123' },
})
check('login with a wrong password is rejected', wrong.response.status === 401, `status=${wrong.response.status}`)

// 4. A login with a wrong password does not leak the password hash.
check('failed login does not leak data', wrong.payload?.data === null, JSON.stringify(wrong.payload))

// 5. A login with the correct credentials succeeds.
const login = await request('/auth/login', {
  method: 'POST',
  headers: { 'X-CSRF-Token': token },
  body: { email: EMAIL, password: PASSWORD },
})
check('login succeeds', login.response.status === 200 && login.payload?.success === true, JSON.stringify(login.payload))
check('login returns the user', login.payload?.data?.user?.email === EMAIL, JSON.stringify(login.payload?.data?.user))
check('login does not leak the password hash', login.payload?.data?.user?.password_hash === undefined)

// 6. The session id changed after the login (session fixation protection).
const rotated = login.payload?.data?.csrf_token
check('a new CSRF token is issued after the login', typeof rotated === 'string' && rotated.length > 0 && rotated !== token)

// 7. The current user is restored from the session cookie.
const me = await request('/auth/me')
check('the session is restored', me.payload?.data?.user?.email === EMAIL, JSON.stringify(me.payload))

// 8. The password hash is never part of the public user payload.
check('the public user has no password hash', me.payload?.data?.user?.password_hash === undefined)

// 9. A logout with the rotated token succeeds.
const logout = await request('/auth/logout', {
  method: 'POST',
  headers: { 'X-CSRF-Token': rotated },
})
check('logout succeeds', logout.response.status === 200 && logout.payload?.success === true, JSON.stringify(logout.payload))

// 10. The session is gone after the logout.
const after = await request('/auth/me')
check('no user is signed in after the logout', after.payload?.data?.user === null, JSON.stringify(after.payload))

// 11. A logout without a CSRF token is rejected.
const logoutNoToken = await request('/auth/logout', { method: 'POST' })
check('logout without a CSRF token is rejected', logoutNoToken.response.status === 419, `status=${logoutNoToken.response.status}`)

// 12. An empty email is a validation error.
const empty = await request('/auth/login', {
  method: 'POST',
  headers: { 'X-CSRF-Token': after.payload?.data?.csrf_token ?? '' },
  body: { email: '', password: PASSWORD },
})
check('an empty email is a validation error', empty.response.status === 422, `status=${empty.response.status}`)

if (failures > 0) {
  console.error(`\n${failures} auth check(s) failed.`)
  process.exit(1)
}

console.log('\nThe authentication flow behaves as expected.')
