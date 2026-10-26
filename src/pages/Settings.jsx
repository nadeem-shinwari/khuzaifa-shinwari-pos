import { useEffect, useState } from 'react'

import { Alert, EmptyState, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { apiGet, apiPost, apiRequest } from '../services/api'

const defaults = { setting_key: '', setting_value: '', setting_group: 'general' }

export function Settings() {
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
    setLoading(true); setError('')
    try {
      const payload = await apiGet('settings', { page: nextPage, per_page: perPage, search })
      setRows(payload?.data ?? [])
      setTotalPages(Math.max(1, payload?.pagination?.pages ?? 1))
    } catch (caught) { setError(caught.message || 'Unable to load settings.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load(page) }, [page]) // eslint-disable-line

  function startEdit(row) {
    setEditingId(row.id)
    setForm({ setting_key: row.setting_key || '', setting_value: row.setting_value || '', setting_group: row.setting_group || 'general' })
  }
  function reset() { setEditingId(null); setForm(defaults); setError('') }

  async function submit(event) {
    event.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { setting_key: form.setting_key.trim(), setting_value: form.setting_value, setting_group: form.setting_group.trim() }
      if (editingId) await apiRequest(`settings/${editingId}`, { method: 'PATCH', body: payload })
      else await apiPost('settings', payload)
      reset(); await load(page)
    } catch (caught) { setError(caught.message || 'Unable to save setting.') }
    finally { setSaving(false) }
  }
  async function remove(id) {
    if (!window.confirm('Delete this setting?')) return
    try { await apiRequest(`settings/${id}`, { method: 'DELETE' }); await load(page) }
    catch (caught) { setError(caught.message || 'Unable to delete setting.') }
  }

  return (
    <div className="space-y-6">
      <Card title="Setting form" description="Manage application settings.">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Key</span><input value={form.setting_key} onChange={(e) => setForm({ ...form, setting_key: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Group</span><input value={form.setting_group} onChange={(e) => setForm({ ...form, setting_group: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required /></label>
          <label className="block text-sm md:col-span-2"><span className="mb-1 block font-medium text-ink-700">Value</span><textarea value={form.setting_value} onChange={(e) => setForm({ ...form, setting_value: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" rows={3} /></label>
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving?' : editingId ? 'Update setting' : 'Add setting'}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={reset}>Cancel</Button>}
          </div>
        </form>
      </Card>
      <Card title="Settings list" description="Stored settings.">
        <div className="mb-3 flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search?" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
          <Button type="button" variant="secondary" size="sm" onClick={() => { setPage(1); load(1) }}>Search</Button>
        </div>
        {error && <Alert variant="error" title="Unable to load settings">{error}</Alert>}
        {loading ? <LoadingState label="Loading settings?" /> : rows.length === 0 ? <EmptyState title="No settings yet" description="Add a setting to get started." /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600"><tr>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium">Group</th>
                <th className="px-3 py-2 font-medium">Value</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-ink-100">
                    <td className="px-3 py-3 font-medium text-ink-900">{row.setting_key}</td>
                    <td className="px-3 py-3 text-ink-600">{row.setting_group}</td>
                    <td className="px-3 py-3 text-ink-600">{row.setting_value}</td>
                    <td className="px-3 py-3"><div className="flex gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(row)}>Edit</Button>
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

export default Settings
