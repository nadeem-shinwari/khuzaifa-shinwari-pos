import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { navigation } from '../config/navigation'
import Header from './Header'
import Sidebar from './Sidebar'

/**
 * The responsive application shell.
 *
 * On large screens the sidebar is fixed to the left and the content scrolls
 * next to it. On small screens the sidebar becomes a drawer that is opened
 * from the header.
 */
export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const current =
    navigation.find((item) => item.path === location.pathname) ?? navigation[0]

  return (
    <div className="flex min-h-screen bg-ink-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={current.label}
          subtitle={current.available ? 'Overview' : current.description}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>

        <footer className="border-t border-ink-200 px-4 py-4 text-center text-xs text-ink-400 sm:px-6">
          Khuzaifa Shinwari Management Suite · Phase 1
        </footer>
      </div>
    </div>
  )
}

export default AppShell
