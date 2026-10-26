/**
 * Contract check between the frontend and the running API.
 *
 * Verifies that every field the Dashboard reads is actually present in the
 * payload returned by the backend. Run it while the PHP server is up:
 *
 *   php -S 127.0.0.1:8000 backend/server-router.php
 *   node scripts/api-contract-check.mjs
 */
const API_BASE = process.env.API_BASE ?? 'http://127.0.0.1:8000/api/v1'

/** Field paths the Dashboard component depends on. */
const EXPECTED = {
  'system/health': [
    'status',
    'app',
    'environment',
    'php_version',
    'database.connection',
    'database.driver',
    'database.reachable',
    'time',
  ],
  'system/info': ['name', 'api_version', 'csrf_header', 'default_currency', 'max_page_size'],
}

function readPath(object, path) {
  return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), object)
}

let failures = 0

for (const [endpoint, paths] of Object.entries(EXPECTED)) {
  const url = `${API_BASE}/${endpoint}`

  let payload

  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    payload = await response.json()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${endpoint} -> request failed: ${error.message}`)
    continue
  }

  if (payload?.success !== true) {
    failures += 1
    console.error(`FAIL ${endpoint} -> success is not true: ${JSON.stringify(payload)}`)
    continue
  }

  if (payload.data == null || typeof payload.data !== 'object') {
    failures += 1
    console.error(`FAIL ${endpoint} -> "data" is not an object`)
    continue
  }

  const missing = paths.filter((path) => readPath(payload.data, path) === undefined)

  if (missing.length > 0) {
    failures += 1
    console.error(`FAIL ${endpoint} -> missing fields: ${missing.join(', ')}`)
    continue
  }

  console.log(`OK  ${endpoint} -> all ${paths.length} fields present`)
}

if (failures > 0) {
  console.error(`\n${failures} endpoint(s) do not match the frontend contract.`)
  process.exit(1)
}

console.log('\nThe API matches the frontend contract.')
