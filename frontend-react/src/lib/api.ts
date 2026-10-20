import axios from 'axios'

import { createApi } from '@shared/api'

import type {
  AudioUploadResponse,
  CreateNoteDTO,
  CreateTaskDTO,
  Note,
  Task,
  TaskFilters,
  UpdateTaskDTO,
} from '../types/productivity'

export { extractErrorMessage } from '@shared/api'

// Vacío => Axios usa rutas relativas (mismo origen) y el proxy de Vite
// reenvía /api/* al backend. Con valor => pega directo a esa URL.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim()

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

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
