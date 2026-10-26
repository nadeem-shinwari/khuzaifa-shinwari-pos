/**
 * Formatting helpers shared by the whole application.
 */

const DEFAULT_CURRENCY = 'PKR'

/**
 * Format an amount as a currency string.
 *
 * @param {number|string} value
 * @param {string} [currency]
 */
export function formatCurrency(value, currency = DEFAULT_CURRENCY) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '—'
  }

  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

/** Format a number with thousand separators. */
export function formatNumber(value, maximumFractionDigits = 0) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '—'
  }

  return new Intl.NumberFormat('en-PK', { maximumFractionDigits }).format(amount)
}

/** Format a percentage value. */
export function formatPercent(value) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '—'
  }

  return `${amount.toFixed(1)}%`
}

/** Format an ISO date string as a readable date. */
export function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/** Format an ISO date string as a readable date and time. */
export function formatDateTime(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Build a class name from a list of conditional values. */
export function cx(...values) {
  return values.filter(Boolean).join(' ')
}
