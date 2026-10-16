import axios from 'axios'

<<<<<<< HEAD
import { createApi } from '@shared/api'

export { extractErrorMessage } from '@shared/api'
=======
import type {
  Account,
  AudioUploadResponse,
  AccountCreateRequest,
  AccountUpdateRequest,
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  CreateNoteDTO,
  CreateTaskDTO,
  CreateTransactionDTO,
  ErrorResponse,
  FinanceSummary,
  LoginRequest,
  LoginResponse,
  Note,
  RegisterRequest,
  Task,
  TaskFilters,
  Transaction,
  TransactionFilters,
  UpdateTaskDTO,
  UserPublic,
} from './types'
>>>>>>> main

// Vacío => Axios usa rutas relativas (mismo origen) y el proxy de Vite
// reenvía /api/* al backend. Con valor => pega directo a esa URL.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim()

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

<<<<<<< HEAD
export const {
  registerRequest,
  loginRequest,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTransactions,
  createTransaction,
  getFinanceSummary,
} = createApi(http)
=======
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

// ── Cuentas ─────────────────────────────────────────────────

export async function getAccounts(): Promise<Account[]> {
  const { data } = await http.get<Account[]>('/api/accounts')
  return data
}

export async function createAccount(payload: AccountCreateRequest): Promise<Account> {
  const { data } = await http.post<Account>('/api/accounts', payload)
  return data
}

export async function updateAccount(
  id: string,
  payload: AccountUpdateRequest,
): Promise<Account> {
  const { data } = await http.put<Account>(`/api/accounts/${id}`, payload)
  return data
}

export async function deleteAccount(id: string): Promise<void> {
  await http.delete(`/api/accounts/${id}`)
}

// ── Categorías / Sobres ─────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const { data } = await http.get<Category[]>('/api/categories')
  return data
}

export async function createCategory(payload: CategoryCreateRequest): Promise<Category> {
  const { data } = await http.post<Category>('/api/categories', payload)
  return data
}

export async function updateCategory(
  id: string,
  payload: CategoryUpdateRequest,
): Promise<Category> {
  const { data } = await http.put<Category>(`/api/categories/${id}`, payload)
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  await http.delete(`/api/categories/${id}`)
}

// ── Transacciones y Resumen ─────────────────────────────────

export async function getTransactions(params?: TransactionFilters): Promise<Transaction[]> {
  // Se omiten los filtros vacíos: el backend rechaza query params inválidos.
  const query = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => Boolean(value)),
  )
  const { data } = await http.get<Transaction[]>('/api/transactions', { params: query })
  return data
}

export async function createTransaction(payload: CreateTransactionDTO): Promise<Transaction> {
  const { data } = await http.post<Transaction>('/api/transactions', payload)
  return data
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const { data } = await http.get<FinanceSummary>('/api/finances/summary')
  return data
}

// ── Productividad: Tareas ───────────────────────────────────

export async function getTasks(params?: TaskFilters): Promise<Task[]> {
  // Se omiten los filtros vacíos: el backend rechaza query params inválidos.
  const query = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => Boolean(value)),
  )
  const { data } = await http.get<Task[]>('/api/tasks', { params: query })
  return data
}

export async function createTask(payload: CreateTaskDTO): Promise<Task> {
  const { data } = await http.post<Task>('/api/tasks', payload)
  return data
}

/** Edición parcial (`PATCH`): solo se modifican los campos enviados. */
export async function updateTask(id: string, payload: UpdateTaskDTO): Promise<Task> {
  const { data } = await http.patch<Task>(`/api/tasks/${id}`, payload)
  return data
}

export async function deleteTask(id: string): Promise<void> {
  await http.delete(`/api/tasks/${id}`)
}

// ── Productividad: Notas multimedia ─────────────────────────

export async function getNotes(): Promise<Note[]> {
  const { data } = await http.get<Note[]>('/api/notes')
  return data
}

export async function createNote(payload: CreateNoteDTO): Promise<Note> {
  const { data } = await http.post<Note>('/api/notes', payload)
  return data
}

export async function deleteNote(id: string): Promise<void> {
  await http.delete(`/api/notes/${id}`)
}

const AUDIO_EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
}

/** Sube un audio (`multipart/form-data`, campo `file`) y devuelve su `audio_url`. */
export async function uploadAudioNote(file: Blob | File): Promise<AudioUploadResponse> {
  const form = new FormData()
  if (file instanceof File) {
    form.append('file', file)
  } else {
    const baseType = file.type.split(';')[0].trim()
    form.append('file', file, `nota-de-voz.${AUDIO_EXTENSIONS[baseType] ?? 'webm'}`)
  }
  // El header explícito evita que Axios serialice el FormData como JSON (el
  // cliente usa `application/json` por defecto); el navegador agrega el boundary.
  const { data } = await http.post<AudioUploadResponse>('/api/notes/upload-audio', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  })
  return data
}

/**
 * `audio_url` es un path relativo (`/uploads/audio/...`) servido por el
 * backend. Con `VITE_API_BASE_URL` vacío lo resuelve el proxy de Vite.
 */
export function resolveMediaUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`
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
>>>>>>> main
