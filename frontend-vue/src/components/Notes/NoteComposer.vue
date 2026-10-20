<script setup lang="ts">
import { computed, ref } from 'vue'

import { formatClock, formatDateTime } from '@shared/format'

import { MAX_RECORDING_MS, useAudioRecorder } from '../../composables/useAudioRecorder'
import { createNote, extractErrorMessage, uploadAudioNote } from '../../lib/api'
import type { CreateNoteDTO, Note } from '../../types/productivity'
import Alert from '../Alert.vue'
import Spinner from '../Spinner.vue'

const emit = defineEmits<{ created: [note: Note] }>()

const TITLE_MAX_LENGTH = 200

type SavePhase = 'idle' | 'uploading' | 'saving'

const title = ref('')
const content = ref('')
const phase = ref<SavePhase>('idle')
const error = ref<string | null>(null)
const saved = ref<string | null>(null)
// Audio cuya subida o guardado falló: se conserva para reintentar sin regrabar.
const pendingAudio = ref<Blob | null>(null)

const busy = computed(() => phase.value !== 'idle')

/**
 * Alta de notas de texto y de voz. Al detener una grabación el audio se sube a
 * `POST /api/notes/upload-audio` y la nota se guarda automáticamente con la
 * `audio_url` obtenida (más el título y el texto escritos, si los hay).
 */
async function saveNote(audio: Blob | null) {
  error.value = null
  saved.value = null
  try {
    const payload: CreateNoteDTO = {
      title:
        title.value.trim() ||
        (audio ? `Nota de voz · ${formatDateTime(new Date().toISOString())}` : ''),
    }
    const trimmedContent = content.value.trim()
    if (trimmedContent) payload.content = trimmedContent

    if (audio) {
      phase.value = 'uploading'
      const { audio_url } = await uploadAudioNote(audio)
      payload.audio_url = audio_url
    }

    phase.value = 'saving'
    const note = await createNote(payload)
    emit('created', note)
    title.value = ''
    content.value = ''
    pendingAudio.value = null
    saved.value = audio ? 'Nota de voz guardada.' : 'Nota guardada.'
  } catch (err) {
    if (audio) pendingAudio.value = audio
    error.value = extractErrorMessage(
      err,
      audio ? 'No se pudo subir la nota de voz.' : 'No se pudo guardar la nota.',
    )
  } finally {
    phase.value = 'idle'
  }
}

const recorder = useAudioRecorder({ onRecorded: (blob) => void saveNote(blob) })
const { status, permission, elapsedMs, level } = recorder
const recorderError = recorder.error
const recording = computed(() => status.value === 'recording')

const canSaveText = computed(() => title.value.trim().length > 0 && !busy.value && !recording.value)

function handleSubmit() {
  if (canSaveText.value) void saveNote(null)
}
</script>

<template>
  <form
    novalidate
    class="flex flex-col gap-3 pulse-card p-4 sm:p-5"
    @submit.prevent="handleSubmit"
  >
    <Alert v-if="error" variant="error">{{ error }}</Alert>
    <Alert v-if="saved && !error" variant="success">{{ saved }}</Alert>
    <Alert v-if="recorderError" variant="error">{{ recorderError }}</Alert>

    <input
      v-model="title"
      aria-label="Título"
      placeholder="Título de la nota"
      :maxlength="TITLE_MAX_LENGTH"
      :disabled="busy"
      class="w-full border-0 border-b border-line bg-transparent px-0 py-1.5 text-base font-semibold text-fg outline-none placeholder:text-fg-dim focus:border-accent disabled:text-fg-dim"
    />
    <textarea
      v-model="content"
      aria-label="Contenido"
      placeholder="Escribí tu nota… o grabá un audio."
      rows="3"
      :disabled="busy"
      class="w-full resize-y border-0 bg-transparent px-0 py-1 text-sm text-fg-soft outline-none placeholder:text-fg-dim disabled:text-fg-dim"
    />

    <div
      v-if="recording"
      class="flex items-center gap-3 rounded-xl bg-danger/10 px-3.5 py-2.5"
      role="status"
      aria-live="polite"
    >
      <span class="relative flex h-3 w-3">
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-soft opacity-75"
        />
        <span class="relative inline-flex h-3 w-3 rounded-full bg-danger" />
      </span>
      <span class="font-mono text-sm font-semibold tabular-nums text-danger-soft">
        {{ formatClock(elapsedMs) }}
      </span>
      <span class="hidden text-xs text-danger-soft/80 sm:inline">
        / {{ formatClock(MAX_RECORDING_MS) }} máx.
      </span>
      <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-danger/20" aria-hidden="true">
        <div
          class="h-full rounded-full bg-danger-soft transition-[width] duration-75"
          :style="{ width: `${Math.round(level * 100)}%` }"
        />
      </div>
      <button
        type="button"
        class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger-soft transition hover:bg-danger/20"
        @click="recorder.cancel"
      >
        Descartar
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-danger-strong"
        @click="recorder.stop"
      >
        <span class="h-2.5 w-2.5 rounded-sm bg-white" aria-hidden="true" />
        Detener
      </button>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
      <div class="flex flex-wrap items-center gap-2">
        <p v-if="permission === 'unsupported'" class="text-xs text-fg-muted">
          Tu navegador no permite grabar audio (se requiere HTTPS o localhost).
        </p>
        <button
          v-else-if="permission !== 'granted' && !recording"
          type="button"
          :disabled="busy || status === 'requesting'"
          class="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white/[0.03] px-3 py-2 text-sm font-medium text-fg-soft transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          @click="void recorder.requestPermission()"
        >
          <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" stroke-width="1.8" />
            <path
              d="M5 11a7 7 0 0014 0M12 18v3"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
          {{ permission === 'denied' ? 'Reintentar permiso de micrófono' : 'Activar micrófono' }}
        </button>

        <button
          v-if="permission !== 'unsupported' && !recording"
          type="button"
          :disabled="busy || status === 'requesting'"
          class="inline-flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-danger-strong disabled:cursor-not-allowed disabled:bg-danger/40"
          @click="void recorder.start()"
        >
          <span class="h-2.5 w-2.5 rounded-full bg-white" aria-hidden="true" />
          Grabar nota de voz
        </button>

        <button
          v-if="pendingAudio && !busy && !recording"
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent/10"
          @click="void saveNote(pendingAudio)"
        >
          Reintentar subida
        </button>

        <span v-if="busy" class="inline-flex items-center gap-2 text-sm text-fg-muted" role="status">
          <Spinner svg-class="h-4 w-4 text-accent" />
          {{ phase === 'uploading' ? 'Subiendo audio…' : 'Guardando nota…' }}
        </span>
      </div>

      <button
        type="submit"
        :disabled="!canSaveText"
        class="rounded-lg bg-accent shadow-glow px-3.5 py-2 text-sm font-semibold text-ink transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-accent/30 disabled:text-ink/50 disabled:shadow-none"
      >
        Guardar nota
      </button>
    </div>
  </form>
</template>
