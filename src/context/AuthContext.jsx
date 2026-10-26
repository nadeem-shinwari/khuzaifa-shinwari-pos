/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { fetchCurrentUser, signIn as signInService, signOut as signOutService } from '../services/auth'

const AuthContext = createContext(null)

/**
 * Provides the signed in user to the whole application and restores the
 * session from the backend on first load.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchCurrentUser()
      .then((resolved) => {
        if (!cancelled) {
          setUser(resolved)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (credentials) => {
    const resolved = await signInService(credentials)
    setUser(resolved)
    return resolved
  }, [])

  const signOut = useCallback(async () => {
    await signOutService()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      signIn,
      signOut,
    }),
    [user, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return context
}
