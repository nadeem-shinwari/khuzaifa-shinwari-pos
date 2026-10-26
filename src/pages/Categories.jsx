import { useEffect, useMemo, useState } from 'react'

import { Alert, EmptyState, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { apiGet, apiPost, apiRequest } from '../services/api'
import { formatDateTime } from '../utils/format'

const defaults = {
  code: '',
  name: '',
  description: '',
  is_active: true,
}

export function Categories() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(defaults)
  const [editingId, setEditingId] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  async function loadCategories(nextPage = page) {
    setLoading(true)
    setError('')

    try {
      const payload = await apiGet('categories', {
        page: nextPage,
        per_page: perPage,
        active: true,
      })

      setItems(payload?.data ?? [])
      setTotalPages(Math.max(1, payload?.pagination?.pages ?? 1))
    } catch (caught) {
      setError(caught.message || 'Unable to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadCategories(page), 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])
  const isDirty = useMemo(
    () =>
      editingId !== null ||
      form.code !== defaults.code ||
      form.name !== defaults.name ||
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
        description: form.description.trim(),
        is_active: form.is_active,
      }

      if (!payload.code || !payload.name) {
        throw new Error('Code and name are required.')
      }

      if (editingId) {
        await apiRequest(`categories/${editingId}`, {
          method: 'PATCH',
          body: payload,
          csrf: true,
        })
      } else {
        await apiPost('categories', payload)
      }

      setForm(defaults)
      setEditingId(null)
      await loadCategories(page)
    } catch (caught) {
      setError(caught.message || 'Unable to save category.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (category) => {
    setEditingId(category.id)
    setForm({
      code: category.code ?? '',
      name: category.name ?? '',
      description: category.description ?? '',
      is_active: Boolean(category.is_active),
    })
    setError('')
  }

  const deactivate = async (category) => {
    if (!window.confirm(`Deactivate ${category.name}?`)) {
      return
    }

    try {
      setError('')
      await apiRequest(`categories/${category.id}`, {
        method: 'DELETE',
        csrf: true,
      })
      await loadCategories(page)
    } catch (caught) {
      setError(caught.message || 'Unable to deactivate category.')
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Categories" description="Catalog groups used by item records.">
        <form onSubmit={submitForm} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-700">Code</span>
              <input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 outline-none ring-0 transition focus:border-brand-500"
              />
            </label>
            <label className="block text-sm md:col-span-1 xl:col-span-2">
              <span className="mb-1 block font-medium text-ink-700">Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 outline-none ring-0 transition focus:border-brand-500"
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

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-ink-900 outline-none transition focus:border-brand-500"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving || !form.code || !form.name} variant="primary">
              {saving ? 'Saving???' : editingId ? 'Update category' : 'Create category'}
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

      <Card title="Category list" description="Latest active item groups.">
        {error && <Alert variant="error" title="Unable to load categories">{error}</Alert>}

        {loading ? (
          <LoadingState label="Loading categories???" />
        ) : items.length === 0 ? (
          <EmptyState title="No categories yet" description="Create the first group to organize your catalog." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((category) => (
                  <tr key={category.id} className="border-t border-ink-100 align-top">
                    <td className="px-3 py-3 font-medium text-ink-900">{category.code}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-ink-900">{category.name}</div>
                      <div className="text-xs text-ink-500">{category.is_active ? 'Active' : 'Inactive'}</div>
                    </td>
                    <td className="px-3 py-3 text-ink-600">{category.description || '???'}</td>
                    <td className="px-3 py-3 text-ink-600">{formatDateTime(category.updated_at || category.created_at)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(category)}>
                          Edit
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => deactivate(category)}>
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

export default Categories

