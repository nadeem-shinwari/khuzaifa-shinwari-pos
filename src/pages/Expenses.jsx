import { useEffect, useState } from 'react'

import { Alert, EmptyState, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { apiGet, apiPost, apiRequest } from '../services/api'
import { formatCurrency, formatDateTime } from '../utils/format'

const defaults = {
  expense_date: new Date().toISOString().slice(0, 10),
  category: '',
  description: '',
  amount: '',
  payment_method: '',
  reference: '',
  notes: '',
}

export function Expenses() {
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

  async function load(nextPage = page) {
    setLoading(true)
    setError('')
    try {
      const payload = await apiGet('expenses', { page: nextPage, per_page: perPage, search })
      setRows(payload?.data ?? [])
      setTotalPages(Math.max(1, payload?.pagination?.pages ?? 1))
    } catch (caught) {
      setError(caught.message || 'Unable to load expenses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { const timer = setTimeout(() => load(page), 0); return () => clearTimeout(timer) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(row) {
    setEditingId(row.id)
    setForm({
      expense_date: (row.expense_date || '').slice(0, 10),
      category: row.category || '',
      description: row.description || '',
      amount: row.amount ?? '',
      payment_method: row.payment_method || '',
      reference: row.reference || '',
      notes: row.notes || '',
    })
  }

  function reset() {
    setEditingId(null)
    setForm(defaults)
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        expense_date: form.expense_date,
        category: form.category.trim(),
        description: form.description.trim(),
        amount: Number(form.amount || 0),
        payment_method: form.payment_method.trim(),
        reference: form.reference.trim(),
        notes: form.notes.trim(),
      }
      if (editingId) {
        await apiRequest(`expenses/${editingId}`, { method: 'PATCH', body: payload })
      } else {
        await apiPost('expenses', payload)
      }
      reset()
      await load(page)
    } catch (caught) {
      setError(caught.message || 'Unable to save expense.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this expense?')) return
    try {
      await apiRequest(`expenses/${id}`, { method: 'DELETE' })
      await load(page)
    } catch (caught) {
      setError(caught.message || 'Unable to delete expense.')
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Expense form" description="Record a business expense.">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Date</span>
            <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Category</span>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block font-medium text-ink-700">Description</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Amount</span>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Payment method</span>
            <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2">
              <option value="">Select method</option>
              {['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Mobile Wallet', 'Other'].map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Reference</span>
            <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block font-medium text-ink-700">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" rows={2} />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving?' : editingId ? 'Update expense' : 'Add expense'}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={reset}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <Card title="Expense list" description="Business expenses.">
        <div className="mb-3 flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search?" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
          <Button type="button" variant="secondary" size="sm" onClick={() => { setPage(1); load(1) }}>Search</Button>
        </div>
        {error && <Alert variant="error" title="Unable to load expenses">{error}</Alert>}
        {loading ? <LoadingState label="Loading expenses?" /> : rows.length === 0 ? <EmptyState title="No expenses yet" description="Add an expense to get started." /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-ink-100">
                    <td className="px-3 py-3 text-ink-600">{formatDateTime(row.expense_date)}</td>
                    <td className="px-3 py-3 font-medium text-ink-900">{row.category}</td>
                    <td className="px-3 py-3 text-ink-600">{row.description}</td>
                    <td className="px-3 py-3 text-ink-600">{formatCurrency(row.amount)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(row)}>Edit</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(row.id)}>Delete</Button>
                      </div>
                    </td>
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

export default Expenses

