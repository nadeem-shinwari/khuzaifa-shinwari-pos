import { useLocation } from 'react-router-dom'

import { navigation } from '../config/navigation'

/**
 * Placeholder page for the modules that are not implemented yet.
 *
 * Keeping the route alive (instead of removing it from the navigation) makes
 * the intended information architecture visible from Phase 1 onwards.
 */
export function Placeholder() {
  const location = useLocation()
  const current = navigation.find((item) => item.path === location.pathname)

  // Defensive fallback: the route table and the navigation registry have to
  // stay in sync, but a missing entry must not crash the page.
  const Icon = current?.icon ?? navigation[0].icon
  const label = current?.label ?? 'Module'
  const description =
    current?.description ?? 'This module is planned for a later phase of the project.'

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-dashed border-ink-300 bg-white p-8 text-center card-shadow">
      <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold text-ink-900">{label}</h2>
      <p className="mt-2 text-sm text-ink-500">{description}</p>
      <p className="mt-4 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
        The navigation, routing and layout are already in place. The data layer for this module
        is added together with its backend endpoints.
      </p>
    </div>
  )
}

export default Placeholder
