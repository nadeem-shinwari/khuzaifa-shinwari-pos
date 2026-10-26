import { useEffect, useMemo, useState } from 'react'

import { Alert, EmptyState, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { apiGet, apiPost, apiRequest } from '../services/api'
import { formatCurrency, formatDateTime } from '../utils/format'

const defaults = {
  code: '',
  name: '',
  category_id: '',
  unit_of_measurement: 'piece',
  purchase_price: '0',
  sale_price: '0',
  opening_stock_quantity: '0',
  reorder_level: '0',
  barcode: '',
  description: '',
  is_active: true,
}

export function Items() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(defaults)
  const [editingId, setEditingId] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  async function loadCategories() {
    try {
      const payload = await apiGet('categories', { page: 1, per_page: 200, active: true })
      setCategories(payload?.data ?? [])
    } catch {
      setCategories([])
    }
  }

  async function loadItems(nextPage = page) {
    setLoading(true)
    setError('')

    try {
      const payload = await apiGet('items', {
        page: nextPage,
        per_page: perPage,
        active: true,
      })

      setItems(payload?.data ?? [])
      setTotalPages(Math.max(1, payload?.pagination?.pages ?? 1))
    } catch (caught) {
      setError(caught.message || 'Unable to load items.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCategories()
      loadItems(page)
    }, 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const isDirty = useMemo(
    () =>
      editingId !== null ||
      form.code !== defaults.code ||
      form.name !== defaults.name ||
      String(form.category_id) !== String(defaults.category_id) ||
      form.unit_of_measurement !== defaults.unit_of_measurement ||
      form.purchase_price !== defaults.purchase_price ||
      form.sale_price !== defaults.sale_price ||
      form.opening_stock_quantity !== defaults.opening_stock_quantity ||
      form.reorder_level !== defaults.reorder_level ||
      form.barcode !== defaults.barcode ||
      form.description !== defaults.description ||
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
        category_id: form.category_id ? Number(form.category_id) : null,
        unit_of_measurement: form.unit_of_measurement.trim() || 'piece',
        purchase_price: Number(form.purchase_price || 0),
        sale_price: Number(form.sale_price || 0),
        opening_stock_quantity: Number(form.opening_stock_quantity || 0),
        reorder_level: Number(form.reorder_level || 0),
        barcode: form.barcode.trim(),
        description: form.description.trim(),
        is_active: form.is_active,
      }

      if (!payload.code || !payload.name) {
        throw new Error('Code and name are required.')
      }

      if (editingId) {
        await apiRequest(`items/${editingId}`, {
          method: 'PATCH',
          body: payload,
          csrf: true,
        })
      } else {
        await apiPost('items', payload)
      }

      setForm(defaults)
      setEditingId(null)
      await loadItems(page)
    } catch (caught) {
      setError(caught.message || 'Unable to save item.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm({
      code: item.code ?? '',
      name: item.name ?? '',
      category_id: item.category_id ?? '',
      unit_of_measurement: item.unit_of_measurement ?? 'piece',
      purchase_price: String(item.purchase_price ?? 0),
      sale_price: String(item.sale_price ?? 0),
      opening_stock_quantity: String(item.opening_stock_quantity ?? 0),
      reorder_level: String(item.reorder_level ?? 0),
      barcode: item.barcode ?? '',
      description: item.description ?? '',
      is_active: Boolean(item.is_active),
    })
    setError('')
  }

  const deactivate = async (item) => {
    if (!window.confirm(`Deactivate ${item.name}?`)) {
      return
    }

    try {
      setError('')
      await apiRequest(`items/${item.id}`, {
        method: 'DELETE',
        csrf: true,
      })
      await loadItems(page)
    } catch (caught) {
      setError(caught.message || 'Unable to deactivate item.')
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Items" description="Catalog records and stock metadata.">
        <form onSubmit={submitForm} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="block text-sm xl:col-span-1">
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
            <label className="block text-sm xl:col-span-1">
              <span className="mb-1 block font-medium text-ink-700">Category</span>
              <select
                value={form.category_id}
                onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm xl:col-span-1">
              <span className="mb-1 block font-medium text-ink-700">Unit</span>
              <select
                value={form.unit_of_measurement}
                onChange={(event) => setForm((current) => ({ ...current, unit_of_measurement: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              >
                {['piece', 'dozen', 'box', 'kg', 'g', 'liter', 'meter', 'pack', 'carton'].map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
                {form.unit_of_measurement && !['piece', 'dozen', 'box', 'kg', 'g', 'liter', 'meter', 'pack', 'carton'].includes(form.unit_of_measurement) && (
                  <option value={form.unit_of_measurement}>{form.unit_of_measurement}</option>
                )}
              </select>
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-700">Purchase price</span>
              <input
                type="number"
                step="0.01"
                value={form.purchase_price}
                onChange={(event) => setForm((current) => ({ ...current, purchase_price: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-700">Sale price</span>
              <input
                type="number"
                step="0.01"
                value={form.sale_price}
                onChange={(event) => setForm((current) => ({ ...current, sale_price: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-700">Opening stock</span>
              <input
                type="number"
                step="0.01"
                value={form.opening_stock_quantity}
                onChange={(event) => setForm((current) => ({ ...current, opening_stock_quantity: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-700">Reorder level</span>
              <input
                type="number"
                step="0.01"
                value={form.reorder_level}
                onChange={(event) => setForm((current) => ({ ...current, reorder_level: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-700">Barcode</span>
              <input
                value={form.barcode}
                onChange={(event) => setForm((current) => ({ ...current, barcode: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 focus:border-brand-500"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving || !form.code || !form.name} variant="primary">
              {saving ? 'Saving???' : editingId ? 'Update item' : 'Create item'}
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

      <Card title="Item list" description="Current product catalog entries.">
        {error && <Alert variant="error" title="Unable to load items">{error}</Alert>}

        {loading ? (
          <LoadingState label="Loading items???" />
        ) : items.length === 0 ? (
          <EmptyState title="No items yet" description="Add your catalog items to start tracking stock and pricing." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Stock</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-ink-100 align-top">
                    <td className="px-3 py-3 font-medium text-ink-900">{item.code}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-ink-900">{item.name}</div>
                      <div className="text-xs text-ink-500">{item.unit_of_measurement}</div>
                    </td>
                    <td className="px-3 py-3 text-ink-600">{item.category_name || '???'}</td>
                    <td className="px-3 py-3 text-ink-600">{item.opening_stock_quantity ?? 0}</td>
                    <td className="px-3 py-3 text-ink-600">{formatCurrency(item.sale_price ?? 0)}</td>
                    <td className="px-3 py-3 text-ink-600">{formatDateTime(item.updated_at || item.created_at)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(item)}>
                          Edit
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => deactivate(item)}>
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

export default Items

