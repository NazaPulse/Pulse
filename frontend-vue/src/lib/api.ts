import axios, { AxiosError } from 'axios'

import type {
  ErrorResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserPublic,
} from './types'

// Vacío => Axios usa rutas relativas (mismo origen) y el proxy de Vite
// reenvía /api/* al backend. Con valor => pega directo a esa URL.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim()

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

export async function registerRequest(
  payload: RegisterRequest,
): Promise<UserPublic> {
  const { data } = await http.post<UserPublic>('/api/auth/register', payload)
  return data
}

export async function loginRequest(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('/api/auth/login', payload)
  return data
}

/**
 * Normaliza cualquier fallo (Axios / red / contrato) a un mensaje legible.
 * `ErrorResponse.message` puede ser `string` o `string[]` (ver openapi.yaml).
 */
export function extractErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error. Intentá nuevamente.',
): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const data = error.response.data as Partial<ErrorResponse> | undefined
      const msg = data?.message
      if (Array.isArray(msg) && msg.length > 0) return msg.join(' · ')
      if (typeof msg === 'string' && msg.trim()) return msg
      if (error.response.status === 401) return 'Credenciales incorrectas.'
      return `Error ${error.response.status}.`
    }
    if (error.code === 'ECONNABORTED') return 'La solicitud tardó demasiado.'
    return 'No se pudo conectar con el servidor.'
  }
  return fallback
}
