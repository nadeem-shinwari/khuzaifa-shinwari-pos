import { useEffect, useMemo, useState } from 'react'

import { Alert, EmptyState, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { apiGet, apiRequest } from '../services/api'
import { formatCurrency, formatDateTime } from '../utils/format'

const defaults = {
  code: '',
  name: '',
  phone: '',
  alternate_phone: '',
  address: '',
  opening_balance: '0',
  opening_balance_type: 'receivable',
  notes: '',
  is_active: true,
}

export function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(defaults)
  const [editingId, setEditingId] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  async function loadCustomers(nextPage = page) {
    setLoading(true)
    setError('')

    try {
      const payload = await apiGet('customers', {
        page: nextPage,
        per_page: perPage,
        active: true,
      })

      setCustomers(payload?.data ?? [])
      setTotalPages(Math.max(1, payload?.pagination?.pages ?? 1))
    } catch (caught) {
      setError(caught.message || 'Unable to load customers.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(page), 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const isDirty = useMemo(
    () =>
      editingId !== null ||
      form.code !== defaults.code ||
      form.name !== defaults.name ||
      form.phone !== defaults.phone ||
      form.alternate_phone !== defaults.alternate_phone ||
      form.address !== defaults.address ||
      form.opening_balance !== defaults.opening_balance ||
      form.opening_balance_type !== defaults.opening_balance_type ||
      form.notes !== defaults.notes ||
      form.is_active !== defaults.is_active,
    [editingId, form],
  )

  const submitForm = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        alternate_phone: form.alternate_phone.trim(),
        address: form.address.trim(),
        opening_balance: Number(form.opening_balance || 0),
        opening_balance_type: form.opening_balance_type,
        notes: form.notes.trim(),
        is_active: form.is_active,
      }

      if (!payload.code || !payload.name) {
        throw new Error('Code and name are required.')
      }

      if (editingId) {
        await apiRequest(`customers/${editingId}`, {
          method: 'PATCH',
          body: payload,
          csrf: true,
        })
      } else {
        await apiRequest('customers', {
          method: 'POST',
          body: payload,
          csrf: true,
        })
      }

      setForm(defaults)
      setEditingId(null)
      await loadCustomers(page)
    } catch (caught) {
      setError(caught.message || 'Unable to save customer.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (customer) => {
    setEditingId(customer.id)
    setForm({
      code: customer.code ?? '',
      name: customer.name ?? '',
      phone: customer.phone ?? '',
      alternate_phone: customer.alternate_phone ?? '',
      address: customer.address ?? '',
      opening_balance: String(customer.opening_balance ?? 0),
      opening_balance_type: customer.opening_balance_type ?? 'receivable',
      notes: customer.notes ?? '',
      is_active: Boolean(customer.is_active),
    })
    setError('')
  }

  const deactivate = async (customer) => {
    if (!window.confirm(`Deactivate ${customer.name}?`)) {
      return
    }

    try {
      setError('')
      await apiRequest(`customers/${customer.id}`, {
        method: 'DELETE',
        csrf: true,
      })
      await loadCustomers(page)
    } catch (caught) {
      setError(caught.message || 'Unable to deactivate customer.')
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Customers" description="Customer records and balance metadata.">
        <form onSubmit={submitForm} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-700">Code</span>
              <input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              />
            </label>
            <label className="block text-sm xl:col-span-2">
              <span className="mb-1 block font-medium text-ink-700">Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-700">Phone</span>
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              />
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              Active
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-700">Alternate phone</span>
              <input
                value={form.alternate_phone}
                onChange={(event) => setForm((current) => ({ ...current, alternate_phone: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-700">Opening balance</span>
              <input
                type="number"
                step="0.01"
                value={form.opening_balance}
                onChange={(event) => setForm((current) => ({ ...current, opening_balance: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-700">Opening balance type</span>
              <select
                value={form.opening_balance_type}
                onChange={(event) => setForm((current) => ({ ...current, opening_balance_type: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              >
                <option value="receivable">Receivable</option>
                <option value="payable">Payable</option>
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Address</span>
            <textarea
              rows={3}
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Notes</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving || !form.code || !form.name} variant="primary">
              {saving ? 'Saving???' : editingId ? 'Update customer' : 'Create customer'}
            </Button>
            {isDirty && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setForm(defaults)
                  setEditingId(null)
                  setError('')
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card title="Customer list" description="Current customer master data.">
        {error && <Alert variant="error" title="Unable to load customers">{error}</Alert>}

        {loading ? (
          <LoadingState label="Loading customers???" />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers yet" description="Create a customer record to track balances and sales." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Balance</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-ink-100 align-top">
                    <td className="px-3 py-3 font-medium text-ink-900">{customer.code}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-ink-900">{customer.name}</div>
                      <div className="text-xs text-ink-500">{customer.is_active ? 'Active' : 'Inactive'}</div>
                    </td>
                    <td className="px-3 py-3 text-ink-600">{customer.phone || '???'}</td>
                    <td className="px-3 py-3 text-ink-600">
                      {formatCurrency(customer.opening_balance ?? 0)} {customer.opening_balance_type}
                    </td>
                    <td className="px-3 py-3 text-ink-600">{formatDateTime(customer.updated_at || customer.created_at)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(customer)}>
                          Edit
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => deactivate(customer)}>
                          Deactivate
                        </Button>
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
            <Button type="button" variant="secondary" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-ink-600">Page {page} / {totalPages}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Customers

