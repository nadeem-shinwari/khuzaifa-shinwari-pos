import { apiGet, apiPost, apiRequest, resetCsrfToken, setCsrfToken } from './api'

/**
 * Authentication helpers that talk to the session based backend auth API.
 *
 * The backend never returns a token to store in localStorage: the session
 * cookie is the only credential and CSRF tokens are kept in memory.
 */

/** Restore the signed in user (and refresh the CSRF token) on page load. */
export async function fetchCurrentUser() {
  const payload = await apiGet('auth/me')
  if (payload?.csrf_token) {
    setCsrfToken(payload.csrf_token)
  }
  return payload?.user ?? null
}

/** Sign in with an email and password. */
export async function signIn(credentials) {
  const payload = await apiPost('auth/login', {
    email: credentials.email,
    password: credentials.password,
  })

  if (payload?.csrf_token) {
    setCsrfToken(payload.csrf_token)
  }

  return payload?.user ?? null
}

/** Change the signed in user's password. */
export async function changePassword(credentials) {
  return apiPost('auth/change-password', {
    current_password: credentials.currentPassword,
    new_password: credentials.newPassword,
  })
}
/** End the current session. */
export async function signOut() {
  try {
    await apiRequest('auth/logout', { method: 'POST', csrf: true })
  } finally {
    resetCsrfToken()
  }
}