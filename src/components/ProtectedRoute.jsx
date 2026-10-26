import { Navigate, useLocation } from 'react-router-dom'

import { LoadingState } from './ui/Alert'
import { useAuth } from '../context/AuthContext'

/**
 * Guard that keeps anonymous visitors out of the administration area.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <LoadingState label="Restoring session…" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute