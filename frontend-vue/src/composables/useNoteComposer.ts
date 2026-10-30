import { computed, ref } from 'vue'
import type { Ref } from 'vue'

import { saveErrorMessage, saveNoteDraft, savedMessage } from '@shared/noteComposer'
import type { SavePhase } from '@shared/noteComposer'
import { api, extractErrorMessage } from '../lib/api'
import type { Note } from '../types/productivity'
import { useAudioRecorder } from './useAudioRecorder'

type Draft = { title: Ref<string>; content: Ref<string> }
type SaveStatus = ReturnType<typeof useSaveStatus>

function useSaveStatus() {
  return {
    phase: ref<SavePhase>('idle'),
    error: ref<string | null>(null),
    saved: ref<string | null>(null),
    pendingAudio: ref<Blob | null>(null),
  }
}

/** Guarda la nota; si falla un audio, la grabación queda en `pendingAudio` para reintentar. */
async function saveDraft(draft: Draft, status: SaveStatus, onCreated: (note: Note) => void, audio: Blob | null) {
  status.error.value = null
  status.saved.value = null
  try {
    const values = { title: draft.title.value, content: draft.content.value, audio }
    onCreated(await saveNoteDraft(api, values, (next) => (status.phase.value = next)))
    draft.title.value = ''
    draft.content.value = ''
    status.pendingAudio.value = null
    status.saved.value = savedMessage(Boolean(audio))
  } catch (err) {
    if (audio) status.pendingAudio.value = audio
    status.error.value = extractErrorMessage(err, saveErrorMessage(Boolean(audio)))
  } finally {
    status.phase.value = 'idle'
  }
}

/**
 * Estado del formulario de notas. Si la subida o el guardado de un audio fallan, la
 * grabación se conserva (`pendingAudio`) para reintentar sin volver a grabar.
 */
export function useNoteComposer(onCreated: (note: Note) => void) {
  const draft: Draft = { title: ref(''), content: ref('') }
  const status = useSaveStatus()
  const saveNote = (audio: Blob | null) => saveDraft(draft, status, onCreated, audio)

  const recorder = useAudioRecorder({ onRecorded: (blob) => void saveNote(blob) })
  const busy = computed(() => status.phase.value !== 'idle')
  const recording = computed(() => recorder.status.value === 'recording')
  const canSaveText = computed(() => draft.title.value.trim().length > 0 && !busy.value && !recording.value)

  function handleSubmit() {
    if (canSaveText.value) void saveNote(null)
  }

  const { title, content } = draft
  const { phase, error, saved, pendingAudio } = status
  return { title, content, phase, busy, error, saved, pendingAudio, recorder, recording, canSaveText, saveNote, handleSubmit }
}
