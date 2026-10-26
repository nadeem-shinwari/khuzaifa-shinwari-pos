import { NavLink } from 'react-router-dom'

import { navigation } from '../config/navigation'
import { cx } from '../utils/format'

/**
 * The application sidebar.
 *
 * It renders the full navigation registry. Modules that are not implemented
 * yet stay visible but are marked, which keeps the information architecture
 * stable while the features are built in later phases.
 */
export function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Backdrop for the mobile drawer */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden"
        />
      )}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-200 bg-white',
          'transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-ink-200 px-5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            KS
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">Khuzaifa Shinwari</p>
            <p className="truncate text-xs text-ink-500">Management Suite</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cx(
                      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cx(
                          'size-[18px] shrink-0',
                          isActive ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600',
                        )}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {!item.available && (
                        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                          Soon
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-ink-200 p-4">
          <p className="text-xs text-ink-500">Phase 1 · Foundation</p>
          <p className="mt-0.5 text-xs text-ink-400">API v1 · React 19 · Tailwind 4</p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
