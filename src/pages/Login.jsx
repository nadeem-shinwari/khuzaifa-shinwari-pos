import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { Alert, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'

const defaults = {
  email: 'admin@example.com',
  password: '',
}

export function Login() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState(defaults)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true })
    }
  }, [from, loading, navigate, user])

  if (loading) {
    return <LoadingState label="Restoring session…" />
  }

  if (user) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (!form.email.trim() || !form.password) {
        throw new Error('Email and password are required.')
      }

      await signIn({
        email: form.email.trim(),
        password: form.password,
      })
    } catch (caught) {
      setError(caught?.message || 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            KS
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-ink-900">Administration login</h1>
          <p className="mt-1 text-sm text-ink-500">
            Sign in to manage categories, items, customers and the rest of the suite.
          </p>
        </div>

        <Card title="Sign in" description="Use your administrator credentials.">
          {error && <Alert variant="error" title="Sign in failed">{error}</Alert>}

          <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink-700">Email address</span>
              <input
                type="email"
                autoComplete="username"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                placeholder="admin@example.com"
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink-700">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </label>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-ink-400">
          Demo account: admin@example.com / Admin1234
        </p>
      </div>
    </div>
  )
}

export default Login