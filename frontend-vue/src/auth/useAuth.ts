import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import { http } from '../lib/api'

// Misma clave de localStorage que /frontend-react (interoperabilidad del token).
export const STORAGE_KEY = 'pulse.access_token'

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

// Estado de sesión a nivel de módulo (singleton, como el AuthContext de React).
const token: Ref<string | null> = ref(readStoredToken())

// Mantiene el header Authorization sincronizado con el token vigente.
watch(
  token,
  (value) => {
    if (value) {
      http.defaults.headers.common.Authorization = `Bearer ${value}`
    } else {
      delete http.defaults.headers.common.Authorization
    }
  },
  { immediate: true },
)

function setToken(next: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* almacenamiento no disponible: seguimos sólo con estado en memoria */
  }
  token.value = next
}

function logout(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
  token.value = null
}

/** `true` si hay un token guardado (usado por el navigation guard). */
export function hasToken(): boolean {
  return Boolean(token.value ?? readStoredToken())
}

export interface UseAuth {
  token: Ref<string | null>
  isAuthenticated: ComputedRef<boolean>
  setToken: (next: string) => void
  logout: () => void
}

export function useAuth(): UseAuth {
  return {
    token,
    isAuthenticated: computed(() => Boolean(token.value)),
    setToken,
    logout,
  }
}
