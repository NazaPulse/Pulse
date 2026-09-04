import { createContext } from 'react'

export interface AuthContextValue {
  token: string | null
  isAuthenticated: boolean
  setToken: (token: string) => void
  logout: () => void
}

export const STORAGE_KEY = 'pulse.access_token'

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
