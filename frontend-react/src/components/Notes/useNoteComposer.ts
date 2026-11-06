import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'

import { saveErrorMessage, saveNoteDraft, savedMessage } from '@shared/noteComposer'
import type { SavePhase } from '@shared/noteComposer'
import { api, extractErrorMessage } from '../../lib/api'
import type { Note } from '../../types/productivity'
import { useAudioRecorder } from './useAudioRecorder'

type Setter<T> = (value: T) => void

type SaveTarget = {
  title: string
  content: string
  onCreated: (note: Note) => void
  setTitle: Setter<string>
  setContent: Setter<string>
  setPhase: Setter<SavePhase>
  setError: Setter<string | null>
  setSaved: Setter<string | null>
  setPendingAudio: Setter<Blob | null>
}

/** Guarda la nota; si falla un audio, la grabación queda en `pendingAudio` para reintentar. */
async function saveDraft(target: SaveTarget, audio: Blob | null) {
  target.setError(null)
  target.setSaved(null)
  try {
    target.onCreated(await saveNoteDraft(api, { title: target.title, content: target.content, audio }, target.setPhase))
    target.setTitle('')
    target.setContent('')
    target.setPendingAudio(null)
    target.setSaved(savedMessage(Boolean(audio)))
  } catch (err) {
    if (audio) target.setPendingAudio(audio)
    target.setError(extractErrorMessage(err, saveErrorMessage(Boolean(audio))))
  } finally {
    target.setPhase('idle')
  }
}

function useDraft() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  return { title, setTitle, content, setContent }
}

function useSaveStatus() {
  const [phase, setPhase] = useState<SavePhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [pendingAudio, setPendingAudio] = useState<Blob | null>(null)
  return { phase, setPhase, error, setError, saved, setSaved, pendingAudio, setPendingAudio }
}

/** `saveNote(audio)`: se recrea solo si cambia el borrador o `onCreated`. */
function useSaveNote(
  draft: ReturnType<typeof useDraft>,
  status: ReturnType<typeof useSaveStatus>,
  onCreated: (note: Note) => void,
) {
  const { title, content, setTitle, setContent } = draft
  const { setPhase, setError, setSaved, setPendingAudio } = status
  return useCallback(
    (audio: Blob | null) =>
      saveDraft(
        { title, content, onCreated, setTitle, setContent, setPhase, setError, setSaved, setPendingAudio },
        audio,
      ),
    [title, content, onCreated, setTitle, setContent, setPhase, setError, setSaved, setPendingAudio],
  )
}

/**
 * Estado del formulario de notas. Si la subida o el guardado de un audio fallan, la
 * grabación se conserva (`pendingAudio`) para reintentar sin volver a grabar.
 */
export function useNoteComposer(onCreated: (note: Note) => void) {
  const draft = useDraft()
  const status = useSaveStatus()
  const saveNote = useSaveNote(draft, status, onCreated)
  const { title } = draft

  const recorder = useAudioRecorder({ onRecorded: (blob) => void saveNote(blob) })
  const busy = status.phase !== 'idle'
  const recording = recorder.status === 'recording'
  const canSaveText = title.trim().length > 0 && !busy && !recording

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSaveText) void saveNote(null)
  }

  return {
    ...draft,
    phase: status.phase,
    busy,
    error: status.error,
    saved: status.saved,
    pendingAudio: status.pendingAudio,
    recorder,
    recording,
    canSaveText,
    saveNote,
    handleSubmit,
  }
}
