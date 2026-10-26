import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert, EmptyState, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { apiGet } from '../services/api'
import { formatCurrency, formatDateTime } from '../utils/format'

const WEEK_DAYS = 7

function startOfWeekWindow() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - (WEEK_DAYS - 1))
  return date
}

function isWithinWeek(value) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date >= startOfWeekWindow()
}

function StatCard({ label, weekly, total, hint }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 card-shadow">
      <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-ink-900">{weekly}</p>
      <p className="mt-0.5 text-xs text-ink-400">{hint}</p>
      <p className="mt-2 text-xs font-medium text-ink-600">Total: {total}</p>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState({
    sales: [],
    purchases: [],
    items: [],
    expenses: [],
    customers: [],
    suppliers: [],
    salesTotal: 0,
    purchasesTotal: 0,
    itemsTotal: 0,
    expensesTotal: 0,
    customersTotal: 0,
    suppliersTotal: 0,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [
          salesPayload,
          purchasesPayload,
          itemsPayload,
          expensesPayload,
          customersPayload,
          suppliersPayload,
        ] = await Promise.all([
          apiGet('sales', { page: 1, per_page: 200 }),
          apiGet('purchases', { page: 1, per_page: 200 }),
          apiGet('items', { page: 1, per_page: 200 }),
          apiGet('expenses', { page: 1, per_page: 200 }),
          apiGet('customers', { page: 1, per_page: 200 }),
          apiGet('suppliers', { page: 1, per_page: 200 }),
        ])

        if (cancelled) return

        setData({
          sales: salesPayload?.data ?? [],
          purchases: purchasesPayload?.data ?? [],
          items: itemsPayload?.data ?? [],
          expenses: expensesPayload?.data ?? [],
          customers: customersPayload?.data ?? [],
          suppliers: suppliersPayload?.data ?? [],
          salesTotal: salesPayload?.pagination?.total ?? (salesPayload?.data ?? []).length,
          purchasesTotal: purchasesPayload?.pagination?.total ?? (purchasesPayload?.data ?? []).length,
          itemsTotal: itemsPayload?.pagination?.total ?? (itemsPayload?.data ?? []).length,
          expensesTotal: expensesPayload?.pagination?.total ?? (expensesPayload?.data ?? []).length,
          customersTotal: customersPayload?.pagination?.total ?? (customersPayload?.data ?? []).length,
          suppliersTotal: suppliersPayload?.pagination?.total ?? (suppliersPayload?.data ?? []).length,
        })
      } catch (caught) {
        if (!cancelled) {
          setError(caught.message || 'Unable to load dashboard data.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const weeklySales = data.sales.filter((row) => isWithinWeek(row.sale_date))
  const weeklyPurchases = data.purchases.filter((row) => isWithinWeek(row.purchase_date))
  const weeklyExpenses = data.expenses.filter((row) => isWithinWeek(row.expense_date))
  const weeklyItems = data.items.filter((row) => isWithinWeek(row.created_at))
  const weeklyCustomers = data.customers.filter((row) => isWithinWeek(row.created_at))
  const weeklySuppliers = data.suppliers.filter((row) => isWithinWeek(row.created_at))

  const weeklySalesAmount = weeklySales.reduce((sum, row) => sum + Number(row.total_amount || 0), 0)
  const weeklyPurchasesAmount = weeklyPurchases.reduce((sum, row) => sum + Number(row.total_amount || 0), 0)
  const weeklyExpensesAmount = weeklyExpenses.reduce((sum, row) => sum + Number(row.amount || 0), 0)

  const recentSales = [...data.sales]
    .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
    .slice(0, 5)
  const recentPurchases = [...data.purchases]
    .sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date))
    .slice(0, 5)

  if (loading) {
    return <LoadingState label="Loading dashboard…" />
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error" title="Unable to load dashboard">{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Weekly sales" weekly={`${weeklySales.length} invoices`} total={`${data.salesTotal} invoices`} hint={formatCurrency(weeklySalesAmount)} />
        <StatCard label="Weekly purchases" weekly={`${weeklyPurchases.length} invoices`} total={`${data.purchasesTotal} invoices`} hint={formatCurrency(weeklyPurchasesAmount)} />
        <StatCard label="Weekly items" weekly={`${weeklyItems.length} new`} total={`${data.itemsTotal} items`} hint="New items this week" />
        <StatCard label="Weekly expenses" weekly={formatCurrency(weeklyExpensesAmount)} total={`${data.expensesTotal} records`} hint={`${weeklyExpenses.length} expense entries`} />
        <StatCard label="Weekly customers" weekly={`${weeklyCustomers.length} new`} total={`${data.customersTotal} customers`} hint="New customers this week" />
        <StatCard label="Weekly suppliers" weekly={`${weeklySuppliers.length} new`} total={`${data.suppliersTotal} suppliers`} hint="New suppliers this week" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="5 recent sales invoices" description="Latest sales records.">
          {recentSales.length === 0 ? (
            <EmptyState title="No sales yet" description="Add a sale to see recent invoices here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-ink-50 text-ink-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Customer</th>
                    <th className="px-3 py-2 font-medium">Total</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((row) => (
                    <tr key={row.id} className="border-t border-ink-100">
                      <td className="px-3 py-3 text-ink-600">{formatDateTime(row.sale_date)}</td>
                      <td className="px-3 py-3 font-medium text-ink-900">{row.customer_name}</td>
                      <td className="px-3 py-3 text-ink-600">{formatCurrency(row.total_amount)}</td>
                      <td className="px-3 py-3">
                        <Button type="button" variant="secondary" size="sm" onClick={() => navigate(`/sales/${row.id}/print`)}>
                          Print
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="5 recent purchase invoices" description="Latest purchase records.">
          {recentPurchases.length === 0 ? (
            <EmptyState title="No purchases yet" description="Add a purchase to see recent invoices here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-ink-50 text-ink-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Supplier</th>
                    <th className="px-3 py-2 font-medium">Total</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPurchases.map((row) => (
                    <tr key={row.id} className="border-t border-ink-100">
                      <td className="px-3 py-3 text-ink-600">{formatDateTime(row.purchase_date)}</td>
                      <td className="px-3 py-3 font-medium text-ink-900">{row.supplier_name}</td>
                      <td className="px-3 py-3 text-ink-600">{formatCurrency(row.total_amount)}</td>
                      <td className="px-3 py-3">
                        <Button type="button" variant="secondary" size="sm" onClick={() => navigate(`/purchases/${row.id}/print`)}>
                          Print
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Dashboard