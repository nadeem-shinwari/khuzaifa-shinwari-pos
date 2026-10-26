import { useEffect, useState } from 'react'

import { Alert, EmptyState, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { apiGet } from '../services/api'
import { formatDateTime } from '../utils/format'

export function Ledger() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  async function load(nextPage = page) {
    setLoading(true); setError('')
    try {
      const payload = await apiGet('stock-movements', { page: nextPage, per_page: perPage, search })
      setRows(payload?.data ?? [])
      setTotalPages(Math.max(1, payload?.pagination?.pages ?? 1))
    } catch (caught) { setError(caught.message || 'Unable to load ledger.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load(page) }, [page]) // eslint-disable-line

  return (
    <div className="space-y-6">
      <Card title="Stock ledger" description="Inventory movements.">
        <div className="mb-3 flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search?" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
          <Button type="button" variant="secondary" size="sm" onClick={() => { setPage(1); load(1) }}>Search</Button>
        </div>
        {error && <Alert variant="error" title="Unable to load ledger">{error}</Alert>}
        {loading ? <LoadingState label="Loading ledger?" /> : rows.length === 0 ? <EmptyState title="No movements yet" description="Stock movements will appear here." /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600"><tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Change</th>
                <th className="px-3 py-2 font-medium">Before</th>
                <th className="px-3 py-2 font-medium">After</th>
              </tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-ink-100">
                    <td className="px-3 py-3 text-ink-600">{formatDateTime(row.created_at)}</td>
                    <td className="px-3 py-3 font-medium text-ink-900">{row.item_id || '?'}</td>
                    <td className="px-3 py-3 text-ink-600">{row.movement_type}</td>
                    <td className="px-3 py-3 text-ink-600">{row.quantity_change}</td>
                    <td className="px-3 py-3 text-ink-600">{row.quantity_before}</td>
                    <td className="px-3 py-3 text-ink-600">{row.quantity_after}</td>
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

export default Ledger
