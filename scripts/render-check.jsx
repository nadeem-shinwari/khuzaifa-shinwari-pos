/**
 * Render smoke check.
 *
 * Renders the routed pages to static markup so that obvious runtime errors
 * (bad imports, undefined components, invalid JSX) surface without a browser.
 *
 *   npm run check:render
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import AppShell from '../src/layouts/AppShell.jsx'
import { AuthProvider } from '../src/context/AuthContext.jsx'
import Dashboard from '../src/pages/Dashboard.jsx'
import NotFound from '../src/pages/NotFound.jsx'
import Placeholder from '../src/pages/Placeholder.jsx'

const routes = [
  { path: '/', element: <Dashboard /> },
  { path: '/items', element: <Placeholder /> },
  { path: '/does-not-exist', element: <NotFound /> },
]

let failures = 0

for (const route of routes) {
  try {
    const markup = renderToStaticMarkup(
      <AuthProvider>
        <MemoryRouter initialEntries={[route.path]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="items" element={<Placeholder />} />
              <Route path="does-not-exist" element={<NotFound />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    const text = markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const main = /<main[^>]*>([\s\S]*?)<\/main>/.exec(markup)?.[1] ?? ''
    const mainText = main.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    console.log(`OK  ${route.path} -> ${markup.length} bytes`)
    console.log(`    shell: ${text.slice(0, 90)}`)
    console.log(`    main:  ${mainText.slice(0, 220)}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL ${route.path} -> ${error.message}`)
    console.error(error.stack)
  }
}

if (failures > 0) {
  console.error(`\n${failures} route(s) failed to render.`)
  process.exit(1)
}

console.log('\nAll routes rendered successfully.')
