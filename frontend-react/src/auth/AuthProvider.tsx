import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { http } from '../lib/api'
import { AuthContext, STORAGE_KEY } from './context'
import type { AuthContextValue } from './context'

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(readStoredToken)

  // Mantiene el header Authorization sincronizado con el token vigente.
  useEffect(() => {
    if (token) {
      http.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      delete http.defaults.headers.common.Authorization
    }
  }, [token])

  const setToken = useCallback((next: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* almacenamiento no disponible: seguimos sólo con estado en memoria */
    }
    setTokenState(next)
  }, [])

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* noop */
    }
    setTokenState(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ token, isAuthenticated: Boolean(token), setToken, logout }),
    [token, setToken, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
