// Alta de notas de texto y de voz: armado del cuerpo, subida del audio y mensajes. Al detener una
// grabación el audio se sube a `POST /api/notes/upload-audio` y la nota se guarda con la
// `audio_url` obtenida (más el título y el texto escritos, si los hay).
import { formatDateTime } from './format'
import type { AudioUploadResponse, CreateNoteDTO, Note } from './types'

export const TITLE_MAX_LENGTH = 200

export type SavePhase = 'idle' | 'uploading' | 'saving'

export interface NoteDraft {
  title: string
  content: string
  /** Grabación a subir; `null` para una nota solo de texto. */
  audio: Blob | null
}

export interface NotesClient {
  uploadAudioNote(file: Blob): Promise<AudioUploadResponse>
  createNote(payload: CreateNoteDTO): Promise<Note>
}

export function buildNotePayload(draft: NoteDraft, audioUrl?: string, now = new Date()): CreateNoteDTO {
  const fallbackTitle = draft.audio ? `Nota de voz · ${formatDateTime(now.toISOString())}` : ''
  const payload: CreateNoteDTO = { title: draft.title.trim() || fallbackTitle }
  const content = draft.content.trim()
  if (content) payload.content = content
  if (audioUrl) payload.audio_url = audioUrl
  return payload
}

/** Sube el audio (si hay) y crea la nota; informa la fase para mostrar el progreso. */
export async function saveNoteDraft(
  client: NotesClient,
  draft: NoteDraft,
  onPhase: (phase: SavePhase) => void,
): Promise<Note> {
  let audioUrl: string | undefined
  if (draft.audio) {
    onPhase('uploading')
    audioUrl = (await client.uploadAudioNote(draft.audio)).audio_url
  }
  onPhase('saving')
  return client.createNote(buildNotePayload(draft, audioUrl))
}

export const saveErrorMessage = (hasAudio: boolean) =>
  hasAudio ? 'No se pudo subir la nota de voz.' : 'No se pudo guardar la nota.'

export const savedMessage = (hasAudio: boolean) => (hasAudio ? 'Nota de voz guardada.' : 'Nota guardada.')

export const phaseLabel = (phase: SavePhase) => (phase === 'uploading' ? 'Subiendo audio…' : 'Guardando nota…')

export const MIC_UNSUPPORTED_MESSAGE = 'Tu navegador no permite grabar audio (se requiere HTTPS o localhost).'

export const emptyNotesMessage = 'Todavía no tenés notas.'

export const NOTES_LOAD_ERROR = 'No se pudieron cargar tus notas.'
export const NOTE_DELETE_ERROR = 'No se pudo eliminar la nota.'
