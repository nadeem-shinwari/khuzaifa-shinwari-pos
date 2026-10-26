import { apiGet } from './api'

/**
 * System endpoints exposed by the backend during Phase 1.
 */

/** Report whether the API and the database are reachable. */
export function fetchHealth() {
  return apiGet('system/health')
}

/** Static API metadata (version, CSRF header, limits). */
export function fetchSystemInfo() {
  return apiGet('system/info')
}
