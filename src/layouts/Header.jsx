import { LogOut, Menu, Search } from 'lucide-react'

import { useAuth } from '../context/AuthContext'

/**
 * The top application bar: sidebar toggle, page context and quick actions.
 */
export function Header({ title, subtitle, onMenuClick, actions }) {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-ink-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="-ml-1 rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-ink-900 sm:text-lg">{title}</h1>
        {subtitle && <p className="truncate text-xs text-ink-500 sm:text-sm">{subtitle}</p>}
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <label className="relative hidden lg:block">
          <span className="sr-only">Search</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search…"
            className="h-9 w-56 rounded-lg border border-ink-200 bg-ink-50 pr-3 pl-9 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </label>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink-900">{user.name}</p>
            <p className="text-xs text-ink-500">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      )}

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}

export default Header
