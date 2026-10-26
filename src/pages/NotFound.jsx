import { Link } from 'react-router-dom'

/**
 * 404 page for unknown routes.
 */
export function NotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-ink-200 bg-white p-10 text-center card-shadow">
      <p className="text-4xl font-bold text-brand-600">404</p>
      <h2 className="mt-3 text-lg font-semibold text-ink-900">Page not found</h2>
      <p className="mt-2 text-sm text-ink-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to dashboard
      </Link>
    </div>
  )
}

export default NotFound
