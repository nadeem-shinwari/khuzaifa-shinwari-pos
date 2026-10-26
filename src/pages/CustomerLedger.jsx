import { useEffect, useMemo, useState } from 'react'

import { Alert, EmptyState, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { apiGet } from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'

const today = new Date().toISOString().slice(0, 10)

export function CustomerLedger() {
  const [customers, setCustomers] = useState([])
  const [selectedCustomerCode, setSelectedCustomerCode] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState(today)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiGet('customers', { page: 1, per_page: 500, active: true })
      .then((payload) => setCustomers(payload?.data ?? []))
      .catch((caught) => setError(caught.message || 'Unable to load customers.'))
  }, [])

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.code === selectedCustomerCode) || null,
    [customers, selectedCustomerCode],
  )

  async function loadLedger() {
    if (!selectedCustomerCode) {
      setError('Select a customer first.')
      return
    }
    setLoading(true)
    setError('')
    setLoaded(false)
    try {
      const customer = selectedCustomer
      const salesPayload = await apiGet('sales', { customer_code: selectedCustomerCode, page: 1, per_page: 1000 })
      const sales = (salesPayload?.data ?? []).slice().sort((a, b) => {
        const dateCompare = new Date(a.sale_date) - new Date(b.sale_date)
        if (dateCompare !== 0) return dateCompare
        return Number(a.id) - Number(b.id)
      })

      const openingBalance = Number(customer?.opening_balance ?? 0)
      const openingType = customer?.opening_balance_type || 'receivable'

      const start = fromDate ? new Date(fromDate) : null
      const end = toDate ? new Date(toDate) : null

      let openingAtStart = openingType === 'payable' ? -openingBalance : openingBalance
      for (const sale of sales) {
        const saleDate = new Date(sale.sale_date)
        if (start && saleDate < start) {
          openingAtStart += Number(sale.total_amount || 0)
        }
      }

      let running = openingAtStart
      const rows = []

      rows.push({
        id: 'opening',
        date: fromDate || (sales[0]?.sale_date ?? today),
        reference: 'Opening balance',
        type: 'Opening',
        description: 'Balance carried forward',
        debit: openingAtStart > 0 ? openingAtStart : 0,
        credit: openingAtStart < 0 ? Math.abs(openingAtStart) : 0,
        balance: openingAtStart,
      })

      for (const sale of sales) {
        const saleDate = new Date(sale.sale_date)
        if (start && saleDate < start) continue
        if (end && saleDate > end) continue
        const amount = Number(sale.total_amount || 0)
        running += amount
        rows.push({
          id: sale.id,
          date: sale.sale_date,
          reference: `Sale #${sale.id}`,
          type: 'Sale',
          description: sale.notes || sale.customer_name || 'Credit sale',
          debit: amount,
          credit: 0,
          balance: running,
        })
      }

      setEntries(rows)
      setLoaded(true)
    } catch (caught) {
      setError(caught.message || 'Unable to load ledger.')
    } finally {
      setLoading(false)
    }
  }

  const totals = useMemo(() => {
    let debit = 0
    let credit = 0
    for (const entry of entries) {
      debit += Number(entry.debit || 0)
      credit += Number(entry.credit || 0)
    }
    return { debit, credit, balance: entries.length ? entries[entries.length - 1].balance : 0 }
  }, [entries])

  return (
    <div className="space-y-6">
      <Card title="Customer ledger" description="Customer receivable ledger derived from sales and opening balances.">
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Customer</span>
            <select
              value={selectedCustomerCode}
              onChange={(event) => setSelectedCustomerCode(event.target.value)}
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.code}>
                  {customer.code} - {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">From date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">To date</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
            />
          </label>
          <div className="flex items-end gap-2">
            <Button type="button" onClick={loadLedger} disabled={loading}>
              {loading ? 'Loading...' : 'Load ledger'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
          </div>
        </div>

        {selectedCustomer && (
          <div className="mb-4 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-700">
            {selectedCustomer.name} ({selectedCustomer.code}) - opening balance {formatCurrency(selectedCustomer.opening_balance)} {selectedCustomer.opening_balance_type}
          </div>
        )}

        {error && <Alert variant="error" title="Unable to load ledger">{error}</Alert>}

        {loading ? (
          <LoadingState label="Loading ledger..." />
        ) : !loaded ? (
          <EmptyState title="No ledger loaded" description="Select a customer and load the ledger." />
        ) : entries.length === 0 ? (
          <EmptyState title="No entries" description="No ledger entries found for the selected range." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Reference</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Debit</th>
                  <th className="px-3 py-2 font-medium">Credit</th>
                  <th className="px-3 py-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-ink-100">
                    <td className="px-3 py-3 text-ink-600">{formatDate(entry.date)}</td>
                    <td className="px-3 py-3 font-medium text-ink-900">{entry.reference}</td>
                    <td className="px-3 py-3 text-ink-600">{entry.type}</td>
                    <td className="px-3 py-3 text-ink-600">{entry.description}</td>
                    <td className="px-3 py-3 text-ink-600">{entry.debit ? formatCurrency(entry.debit) : '—'}</td>
                    <td className="px-3 py-3 text-ink-600">{entry.credit ? formatCurrency(entry.credit) : '—'}</td>
                    <td className="px-3 py-3 font-medium text-ink-900">{formatCurrency(entry.balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-ink-50 font-medium text-ink-900">
                <tr>
                  <td className="px-3 py-2" colSpan={4}>Totals</td>
                  <td className="px-3 py-2">{formatCurrency(totals.debit)}</td>
                  <td className="px-3 py-2">{formatCurrency(totals.credit)}</td>
                  <td className="px-3 py-2">{formatCurrency(totals.balance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default CustomerLedger
