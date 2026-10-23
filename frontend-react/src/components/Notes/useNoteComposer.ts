import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'

import { saveErrorMessage, saveNoteDraft, savedMessage } from '@shared/noteComposer'
import type { SavePhase } from '@shared/noteComposer'
import { api, extractErrorMessage } from '../../lib/api'
import type { Note } from '../../types/productivity'
import { useAudioRecorder } from './useAudioRecorder'

/**
 * Estado del formulario de notas. Si la subida o el guardado de un audio fallan, la
 * grabación se conserva (`pendingAudio`) para reintentar sin volver a grabar.
 */
export function useNoteComposer(onCreated: (note: Note) => void) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [phase, setPhase] = useState<SavePhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [pendingAudio, setPendingAudio] = useState<Blob | null>(null)

  const saveNote = useCallback(
    async (audio: Blob | null) => {
      setError(null)
      setSaved(null)
      try {
        onCreated(await saveNoteDraft(api, { title, content, audio }, setPhase))
        setTitle('')
        setContent('')
        setPendingAudio(null)
        setSaved(savedMessage(Boolean(audio)))
      } catch (err) {
        if (audio) setPendingAudio(audio)
        setError(extractErrorMessage(err, saveErrorMessage(Boolean(audio))))
      } finally {
        setPhase('idle')
      }
    },
    [title, content, onCreated],
  )

  const recorder = useAudioRecorder({ onRecorded: (blob) => void saveNote(blob) })
  const busy = phase !== 'idle'
  const recording = recorder.status === 'recording'
  const canSaveText = title.trim().length > 0 && !busy && !recording

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSaveText) void saveNote(null)
  }

  return {
    title,
    setTitle,
    content,
    setContent,
    phase,
    busy,
    error,
    saved,
    pendingAudio,
    recorder,
    recording,
    canSaveText,
    saveNote,
    handleSubmit,
  }
}
