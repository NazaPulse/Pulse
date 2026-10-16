import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { http } from '../lib/api'
import { AuthContext, STORAGE_KEY } from './context'
import type { AuthContextValue } from './context'

// Se aplica de forma síncrona (no en un efecto): React ejecuta los efectos de
// las páginas hijas antes que los de este provider, y su primera carga de
// datos saldría sin token al recargar una ruta protegida.
function applyAuthHeader(token: string | null) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete http.defaults.headers.common.Authorization
  }
}

function readStoredToken(): string | null {
  let token: string | null = null
  try {
    token = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    token = null
  }
  applyAuthHeader(token)
  return token
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(readStoredToken)

  const setToken = useCallback((next: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* almacenamiento no disponible: seguimos sólo con estado en memoria */
    }
    applyAuthHeader(next)
    setTokenState(next)
  }, [])

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* noop */
    }
    applyAuthHeader(null)
    setTokenState(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ token, isAuthenticated: Boolean(token), setToken, logout }),
    [token, setToken, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
