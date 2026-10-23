import { computed, ref } from 'vue'

import { saveErrorMessage, saveNoteDraft, savedMessage } from '@shared/noteComposer'
import type { SavePhase } from '@shared/noteComposer'
import { api, extractErrorMessage } from '../lib/api'
import type { Note } from '../types/productivity'
import { useAudioRecorder } from './useAudioRecorder'

/**
 * Estado del formulario de notas. Si la subida o el guardado de un audio fallan, la
 * grabación se conserva (`pendingAudio`) para reintentar sin volver a grabar.
 */
export function useNoteComposer(onCreated: (note: Note) => void) {
  const title = ref('')
  const content = ref('')
  const phase = ref<SavePhase>('idle')
  const error = ref<string | null>(null)
  const saved = ref<string | null>(null)
  const pendingAudio = ref<Blob | null>(null)

  async function saveNote(audio: Blob | null) {
    error.value = null
    saved.value = null
    try {
      const draft = { title: title.value, content: content.value, audio }
      onCreated(await saveNoteDraft(api, draft, (next) => (phase.value = next)))
      title.value = ''
      content.value = ''
      pendingAudio.value = null
      saved.value = savedMessage(Boolean(audio))
    } catch (err) {
      if (audio) pendingAudio.value = audio
      error.value = extractErrorMessage(err, saveErrorMessage(Boolean(audio)))
    } finally {
      phase.value = 'idle'
    }
  }

  const recorder = useAudioRecorder({ onRecorded: (blob) => void saveNote(blob) })
  const busy = computed(() => phase.value !== 'idle')
  const recording = computed(() => recorder.status.value === 'recording')
  const canSaveText = computed(() => title.value.trim().length > 0 && !busy.value && !recording.value)

  function handleSubmit() {
    if (canSaveText.value) void saveNote(null)
  }

  return { title, content, phase, busy, error, saved, pendingAudio, recorder, recording, canSaveText, saveNote, handleSubmit }
}
