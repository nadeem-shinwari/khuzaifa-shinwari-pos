import { useEffect, useState } from 'react'
import { Alert, EmptyState, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGet } from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'

function parseItems(row) {
  let parsed = []
  if (Array.isArray(row?.items)) parsed = row.items
  else if (typeof row?.items === 'string' && row.items.trim()) {
    try { parsed = JSON.parse(row.items) } catch { parsed = [] }
  }
  if (!parsed.length && (row?.item_id || row?.item_name)) {
    parsed = [{ item_id: row.item_id ? String(row.item_id) : '', item_name: row.item_name || '', item_unit: row.item_unit || '', quantity: row.quantity ?? '1', unit_price: row.unit_price ?? '' }]
  }
  return parsed.map((it) => ({
    item_name: it.item_name || it.name || '',
    item_unit: it.item_unit || it.unit || '',
    quantity: it.quantity ?? '1',
    unit_price: it.unit_price ?? it.price ?? 0,
    line_total: Number(it.quantity || 0) * Number(it.unit_price ?? it.price ?? 0),
  }))
}

export function SaleInvoice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [row, setRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError('')
      try {
        const payload = await apiGet(`sales/${id}`)
        if (active) setRow(payload?.data ?? payload)
      } catch (caught) {
        if (active) setError(caught.message || 'Unable to load sale.')
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [id])
  const items = parseItems(row)
  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/sales')}>Back to sales</Button>
        <Button type="button" onClick={() => navigate(`/sales/${id}/print`)}>Print invoice</Button>
      </div>
      {error && <Alert variant="error" title="Unable to load sale">{error}</Alert>}
      {loading ? <LoadingState label="Loading sale..." /> : !row ? <EmptyState title="Sale not found" description="The requested sale could not be loaded." /> : (
        <div className="rounded-xl border border-ink-200 bg-white p-3 shadow-sm print:shadow-none">
          <div className="mb-6 flex items-start justify-between border-b border-ink-200 pb-4">
            <div><h1 className="text-2xl font-bold text-ink-900">Khuzaifa Shinwari</h1><p className="text-sm text-ink-500">Management Suite</p></div>
            <div className="text-right"><h2 className="text-xl font-semibold text-ink-900">SALE INVOICE</h2><p className="text-sm text-ink-600">Invoice #{row.id}</p></div>
          </div>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-ink-500">Customer</p>
              <p className="font-medium text-ink-900">{row.customer_name || '—'}</p>
              <p className="text-sm text-ink-600">{row.customer_code ? `Code: ${row.customer_code}` : ''}</p>
            </div>
            <div className="text-right sm:text-left">
              <p className="text-xs font-semibold uppercase text-ink-500">Date</p>
              <p className="font-medium text-ink-900">{formatDate(row.sale_date)}</p>
              {row.payment_method && <p className="text-sm text-ink-600">Payment: {row.payment_method}</p>}
              {row.reference && <p className="text-sm text-ink-600">Ref: {row.reference}</p>}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600">
                <tr><th className="px-3 py-2 font-medium">#</th><th className="px-3 py-2 font-medium">Item Name</th>
                {/* <th className="px-3 py-2 font-medium">Unit</th> */}
                <th className="px-3 py-2 font-medium">Qty</th><th className="px-3 py-2 font-medium">Price</th><th className="px-3 py-2 font-medium">Sub Total</th></tr>
              </thead>
              <tbody>
                {items.length === 0 ? <tr><td colSpan={6} className="px-3 py-4 text-center text-ink-500">No line items.</td></tr> : items.map((it, index) => (
                  <tr key={index} className="border-t border-ink-100">
                    <td className="px-3 py-3 text-ink-600">{index + 1}</td>
                    <td className="px-3 py-3 font-medium text-ink-900">{it.item_name || '—'}</td>
                    {/* <td className="px-3 py-3 text-ink-600">{it.item_unit || '—'}</td> */}
                    <td className="px-3 py-3 text-ink-600">{it.quantity}</td>
                    <td className="px-3 py-3 text-ink-600">{formatCurrency(it.unit_price)}</td>
                    <td className="px-3 py-3 font-medium text-ink-900">{formatCurrency(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-ink-50 font-medium text-ink-900">
                <tr><td className="px-3 py-2" colSpan={5}>Total</td><td className="px-3 py-2">{formatCurrency(row.total_amount)}</td></tr>
              </tfoot>
            </table>
          </div>
          {row.notes && <div className="mt-6 border-t border-ink-200 pt-4"><p className="text-xs font-semibold uppercase text-ink-500">Notes</p><p className="text-sm text-ink-700">{row.notes}</p></div>}
          <div className="mt-8 border-t border-ink-200 pt-4 text-center text-xs text-ink-500">Thank you for your business.</div>
        </div>
      )}
    </div>
  )
}
export default SaleInvoice
