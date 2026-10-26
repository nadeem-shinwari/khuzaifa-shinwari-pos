/** Temporary render smoke check for the invoice print pages. */
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../src/context/AuthContext.jsx'
import SalePrintInvoice from '../src/pages/SalePrintInvoice.jsx'
import PurchasePrintInvoice from '../src/pages/PurchasePrintInvoice.jsx'

const routes = [
  { path: '/sales/2/print', element: <SalePrintInvoice /> },
  { path: '/purchases/1/print', element: <PurchasePrintInvoice /> },
]

let failures = 0

for (const route of routes) {
  try {
    const markup = renderToStaticMarkup(
      <AuthProvider>
        <MemoryRouter initialEntries={[route.path]}>
          <Routes>
            <Route path="sales/:id/print" element={<SalePrintInvoice />} />
            <Route path="purchases/:id/print" element={<PurchasePrintInvoice />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    const text = markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    console.log(`OK  ${route.path} -> ${markup.length} bytes`)
    console.log(`    text: ${text.slice(0, 200)}`)
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

console.log('\nAll print routes rendered successfully.')
