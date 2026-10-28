// Cliente de Productividad (Tareas, Notas multimedia y Cronograma) del contrato openapi.yaml.
import type { HttpClient } from './api'
import type {
  AudioUploadResponse,
  CreateNoteDTO,
  CreateTaskDTO,
  CreateTimeBlockDTO,
  Note,
  ScheduleRange,
  Task,
  TaskFilters,
  TimeBlock,
  UpdateTaskDTO,
  UpdateTimeBlockDTO,
} from './types'

const AUDIO_EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
}

/** Nombre de archivo de una nota de voz según el tipo MIME de la grabación. */
export function audioFileName(blob: Blob): string {
  const baseType = blob.type.split(';')[0].trim()
  return `nota-de-voz.${AUDIO_EXTENSIONS[baseType] ?? 'webm'}`
}

/** Se omiten los filtros vacíos: el backend rechaza query params inválidos. */
function nonEmpty(params?: TaskFilters): Record<string, unknown> {
  return Object.fromEntries(Object.entries(params ?? {}).filter(([, value]) => Boolean(value)))
}

function tasksApi(http: HttpClient) {
  return {
    async getTasks(params?: TaskFilters): Promise<Task[]> {
      return (await http.get<Task[]>('/api/tasks', { params: nonEmpty(params) })).data
    },
    async createTask(payload: CreateTaskDTO): Promise<Task> {
      return (await http.post<Task>('/api/tasks', payload)).data
    },
    /** Edición parcial (`PATCH`): solo se modifican los campos enviados. */
    async updateTask(id: string, payload: UpdateTaskDTO): Promise<Task> {
      return (await http.patch<Task>(`/api/tasks/${id}`, payload)).data
    },
    async deleteTask(id: string): Promise<void> {
      await http.delete(`/api/tasks/${id}`)
    },
  }
}

function scheduleApi(http: HttpClient) {
  return {
    async getSchedule(range?: ScheduleRange): Promise<TimeBlock[]> {
      return (await http.get<TimeBlock[]>('/api/schedule', { params: { ...range } })).data
    },
    async createTimeBlock(payload: CreateTimeBlockDTO): Promise<TimeBlock> {
      return (await http.post<TimeBlock>('/api/schedule', payload)).data
    },
    /** Edición parcial (`PATCH`): solo se modifican los campos enviados. */
    async updateTimeBlock(id: string, payload: UpdateTimeBlockDTO): Promise<TimeBlock> {
      return (await http.patch<TimeBlock>(`/api/schedule/${id}`, payload)).data
    },
    async deleteTimeBlock(id: string): Promise<void> {
      await http.delete(`/api/schedule/${id}`)
    },
  }
}

function notesApi(http: HttpClient) {
  return {
    async getNotes(): Promise<Note[]> {
      return (await http.get<Note[]>('/api/notes')).data
    },
    async createNote(payload: CreateNoteDTO): Promise<Note> {
      return (await http.post<Note>('/api/notes', payload)).data
    },
    async deleteNote(id: string): Promise<void> {
      await http.delete(`/api/notes/${id}`)
    },
    /** Sube un audio (`multipart/form-data`, campo `file`) y devuelve su `audio_url`. */
    async uploadAudioNote(file: Blob | File): Promise<AudioUploadResponse> {
      const form = new FormData()
      if (file instanceof File) form.append('file', file)
      else form.append('file', file, audioFileName(file))
      // El header explícito evita que Axios serialice el FormData como JSON.
      const config = { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 }
      return (await http.post<AudioUploadResponse>('/api/notes/upload-audio', form, config)).data
    },
  }
}

export function productivityApi(http: HttpClient) {
  return { ...tasksApi(http), ...notesApi(http), ...scheduleApi(http) }
}
