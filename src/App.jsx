import { HashRouter, Route, Routes } from 'react-router-dom'

import AppShell from './layouts/AppShell'
import Banks from './pages/Banks'
import CustomerLedger from './pages/CustomerLedger'
import Categories from './pages/Categories'
import Customers from './pages/Customers'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Items from './pages/Items'
import Ledger from './pages/Ledger'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import Purchases from './pages/Purchases'
import Sales from './pages/Sales'
import SaleInvoice from './pages/SaleInvoice'
import PurchaseInvoice from './pages/PurchaseInvoice'
import SalePrintInvoice from './pages/SalePrintInvoice'
import PurchasePrintInvoice from './pages/PurchasePrintInvoice'
import Suppliers from './pages/Suppliers'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="categories" element={<Categories />} />
          <Route path="items" element={<Items />} />
          <Route path="customer-ledger" element={<CustomerLedger />} />
          <Route path="customers" element={<Customers />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="sales" element={<Sales />} />
          <Route path="sales/:id/invoice" element={<SaleInvoice />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="sales/:id/print" element={<SalePrintInvoice />} />
          <Route path="purchases/:id/print" element={<PurchasePrintInvoice />} />
          <Route path="purchases/:id/invoice" element={<PurchaseInvoice />} />
          <Route path="profile" element={<Profile />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="banks" element={<Banks />} />
          <Route path="settings" element={<Settings />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
