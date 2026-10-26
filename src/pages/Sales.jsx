import { useEffect, useState } from 'react'

import { Alert, EmptyState, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { apiGet, apiPost, apiRequest } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDateTime } from '../utils/format'

const lineItemDefaults = {
  item_id: '',
  item_name: '',
  item_unit: '',
  quantity: '1',
  unit_price: '',
  line_total: 0,
}

const defaults = {
  sale_date: new Date().toISOString().slice(0, 10),
  customer_code: '',
  customer_name: '',
  items: [{ ...lineItemDefaults }],
  total_amount: '',
  payment_method: '',
  reference: '',
  notes: '',
}

export function Sales() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(defaults)
  const [editingId, setEditingId] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState([])
  const [items, setItems] = useState([])

  async function load(nextPage = page) {
    setLoading(true); setError('')
    try {
      const payload = await apiGet('sales', { page: nextPage, per_page: perPage, search })
      setRows(payload?.data ?? [])
      setTotalPages(Math.max(1, payload?.pagination?.pages ?? 1))
    } catch (caught) { setError(caught.message || 'Unable to load sales.') }
    finally { setLoading(false) }
  }
  async function loadCustomers() {
    try { const payload = await apiGet('customers', { page: 1, per_page: 200, active: true }); setCustomers(payload?.data ?? []) } catch { setCustomers([]) }
  }
  async function loadItems() {
    try { const payload = await apiGet('items', { page: 1, per_page: 200, active: true }); setItems(payload?.data ?? []) } catch { setItems([]) }
  }
  useEffect(() => { load(page) }, [page]) // eslint-disable-line
  useEffect(() => { loadCustomers(); loadItems() }, []) // eslint-disable-line

  function parseItems(row) {
    let parsed = []
    if (Array.isArray(row.items)) parsed = row.items
    else if (typeof row.items === 'string' && row.items.trim()) {
      try { parsed = JSON.parse(row.items) } catch { parsed = [] }
    }
    if (!parsed.length && (row.item_id || row.item_name)) {
      parsed = [{ item_id: row.item_id ? String(row.item_id) : '', item_name: row.item_name || '', item_unit: row.item_unit || '', quantity: row.quantity ?? '1', unit_price: row.unit_price ?? '' }]
    }
    if (!parsed.length) parsed = [{ ...lineItemDefaults }]
    return parsed.map((it) => ({
      item_id: it.item_id ? String(it.item_id) : '',
      item_name: it.item_name || '',
      item_unit: it.item_unit || '',
      quantity: it.quantity ?? '1',
      unit_price: it.unit_price ?? '',
      line_total: Number(it.quantity || 0) * Number(it.unit_price || 0),
    }))
  }

  function startEdit(row) {
    setEditingId(row.id)
    setForm({
      sale_date: (row.sale_date || '').slice(0, 10),
      customer_code: row.customer_code || '',
      customer_name: row.customer_name || '',
      items: parseItems(row),
      total_amount: row.total_amount ?? '',
      payment_method: row.payment_method || '',
      reference: row.reference || '',
      notes: row.notes || '',
    })
  }
  function reset() { setEditingId(null); setForm({ ...defaults, items: [{ ...lineItemDefaults }] }); setError('') }

  function recomputeTotal(nextItems) {
    return nextItems.reduce((sum, line) => sum + (Number(line.quantity || 0) * Number(line.unit_price || 0)), 0)
  }

  function updateLine(index, patch) {
    setForm((prev) => {
      const nextItems = prev.items.map((line, i) => {
        if (i !== index) return line
        const updated = { ...line, ...patch }
        updated.line_total = Number(updated.quantity || 0) * Number(updated.unit_price || 0)
        return updated
      })
      return { ...prev, items: nextItems, total_amount: String(recomputeTotal(nextItems)) }
    })
  }

  function addLine() {
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...lineItemDefaults }] }))
  }

  function removeLine(index) {
    setForm((prev) => {
      const nextItems = prev.items.filter((_, i) => i !== index)
      const items = nextItems.length ? nextItems : [{ ...lineItemDefaults }]
      return { ...prev, items, total_amount: String(recomputeTotal(items)) }
    })
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = {
        sale_date: form.sale_date,
        customer_code: form.customer_code.trim(),
        customer_name: form.customer_name.trim(),
        items: form.items.map((line) => ({
          item_id: line.item_id ? Number(line.item_id) : null,
          item_name: line.item_name.trim(),
          item_unit: line.item_unit.trim(),
          quantity: Number(line.quantity || 0),
          unit_price: Number(line.unit_price || 0),
          line_total: Number(line.quantity || 0) * Number(line.unit_price || 0),
        })),
        total_amount: Number(form.total_amount || 0),
        payment_method: form.payment_method.trim(),
        reference: form.reference.trim(),
        notes: form.notes.trim(),
      }
      if (editingId) await apiRequest(`sales/${editingId}`, { method: 'PATCH', body: payload })
      else await apiPost('sales', payload)
      reset(); await load(page)
    } catch (caught) { setError(caught.message || 'Unable to save sale.') }
    finally { setSaving(false) }
  }
  async function remove(id) {
    if (!window.confirm('Delete this sale?')) return
    try { await apiRequest(`sales/${id}`, { method: 'DELETE' }); await load(page) }
    catch (caught) { setError(caught.message || 'Unable to delete sale.') }
  }

  return (
    <div className="space-y-6">
      <Card title="Sale form" description="Record a sale.">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Date</span><input type="date" value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Customer</span><select value={form.customer_code} onChange={(e) => { const c = customers.find((x) => x.code === e.target.value); setForm({ ...form, customer_code: e.target.value, customer_name: c ? c.name : '' }) }} className="w-full rounded-lg border border-ink-200 px-3 py-2" required><option value="">Select customer</option>{customers.map((c) => <option key={c.id} value={c.code}>{c.code} - {c.name}</option>)}</select></label>
          <div className="md:col-span-2 space-y-3 rounded-lg border border-ink-100 p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink-700">Items</span>
              <Button type="button" variant="secondary" size="sm" onClick={addLine}>Add item</Button>
            </div>
            {form.items.map((line, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-6 items-end">
                <label className="block text-sm md:col-span-2"><span className="mb-1 block font-medium text-ink-700">Item</span><select value={line.item_id} onChange={(e) => { const it = items.find((x) => String(x.id) === e.target.value); updateLine(index, { item_id: e.target.value, item_name: it ? it.name : '', item_unit: it ? it.unit_of_measurement : '', unit_price: it ? it.sale_price : line.unit_price }) }} className="w-full rounded-lg border border-ink-200 px-3 py-2"><option value="">Select item</option>{items.map((it) => <option key={it.id} value={it.id}>{it.code} - {it.name}</option>)}</select></label>
                <label className="block text-sm sm:col-span-2"><span className="mb-1 block font-medium text-ink-700">Qty</span><input type="number" step="1" value={line.quantity} onChange={(e) => updateLine(index, { quantity: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" /></label>
                <label className="block text-sm sm:col-span-2"><span className="mb-1 block font-medium text-ink-700">Unit price</span><input type="number" step="0.01" value={line.unit_price} onChange={(e) => updateLine(index, { unit_price: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" /></label>
                <label className="block text-sm sm:col-span-2"><span className="mb-1 block font-medium text-ink-700">Line total</span><input type="number" step="0.01" value={line.line_total} readOnly className="w-full rounded-lg border border-ink-200 px-3 py-2 bg-ink-50" /></label>
                <div className="flex items-end"><Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)}>Remove</Button></div>
              </div>
            ))}
          </div>
          <div className="md:col-span-2 space-y-3 rounded-lg border border-ink-100 p-3">
            <div className="grid gap-2 md:grid-cols-6 items-end">
              <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Total amount</span><input type="number" step="0.01" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required /></label>
              <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Payment method</span><select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2"><option value="">Select method</option>{['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Mobile Wallet', 'Other'].map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
              <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Reference</span><input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" /></label>
              <label className="block text-sm md:col-span-3"><span className="mb-1 block font-medium text-ink-700">Notes</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" rows={1} /></label>
            </div>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving?' : editingId ? 'Update sale' : 'Add sale'}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={reset}>Cancel</Button>}
          </div>
        </form>
      </Card>
      <Card title="Sale list" description="Sales records.">
        <div className="mb-3 flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search?" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
          <Button type="button" variant="secondary" size="sm" onClick={() => { setPage(1); load(1) }}>Search</Button>
        </div>
        {error && <Alert variant="error" title="Unable to load sales">{error}</Alert>}
        {loading ? <LoadingState label="Loading sales?" /> : rows.length === 0 ? <EmptyState title="No sales yet" description="Add a sale to get started." /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600"><tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-ink-100">
                    <td className="px-3 py-3 text-ink-600">{formatDateTime(row.sale_date)}</td>
                    <td className="px-3 py-3 font-medium text-ink-900">{row.customer_name}</td>
                    <td className="px-3 py-3 text-ink-600">{formatCurrency(row.total_amount)}</td>
                    <td className="px-3 py-3"><div className="flex gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(row)}>Edit</Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => navigate(`/sales/${row.id}/print`)}>Print</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(row.id)}>Delete</Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => setPage((c) => Math.max(1, c - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm text-ink-600">Page {page} / {totalPages}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPage((c) => Math.min(totalPages, c + 1))} disabled={page >= totalPages}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Sales
