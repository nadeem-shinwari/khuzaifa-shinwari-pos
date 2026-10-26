import { useState } from 'react'

import { Alert, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import { changePassword } from '../services/auth'
import { formatDateTime } from '../utils/format'

export function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    setSaving(true)
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setSuccess('Password updated successfully.')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (caught) {
      setError(caught.message || 'Unable to update password.')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return <LoadingState label="Loading profile…" />
  }

  return (
    <div className="space-y-6">
      <Card title="Profile" description="Your account details.">
        <dl className="divide-y divide-ink-100 text-sm">
          {[
            ['Name', user.name],
            ['Email', user.email],
            ['Role', user.role],
            ['Status', user.is_active ? 'Active' : 'Inactive'],
            ['Last login', formatDateTime(user.last_login_at)],
            ['Created', formatDateTime(user.created_at)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-ink-500">{label}</dt>
              <dd className="font-medium text-ink-900">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Reset password" description="Change your password.">
        {error && <Alert variant="error" title="Unable to update password">{error}</Alert>}
        {success && <Alert variant="success" title="Password updated">{success}</Alert>}
        <form onSubmit={submit} className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Current password</span>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">New password</span>
            <input
              type="password"
              value={form.newPassword}
              onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Confirm new password</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
              required
            />
          </label>
          <Button type="submit" disabled={saving}>
            {saving ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default Profile