<script setup lang="ts">
import { MIC_UNSUPPORTED_MESSAGE, TITLE_MAX_LENGTH, phaseLabel } from '@shared/noteComposer'
import { useNoteComposer } from '../../composables/useNoteComposer'
import type { Note } from '../../types/productivity'
import Alert from '../Alert.vue'
import Icon from '../Icon.vue'
import Spinner from '../Spinner.vue'
import RecordingBar from './RecordingBar.vue'

const SECONDARY_BUTTON =
  'inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white/[0.03] px-3 py-2 text-sm font-medium text-fg-soft transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60'

const emit = defineEmits<{ created: [note: Note] }>()

// Alta de notas de texto y de voz; al detener una grabación la nota se guarda sola.
const c = useNoteComposer((note) => emit('created', note))
const { recorder } = c
</script>

<template>
  <form class="flex flex-col gap-3 pulse-card p-4 sm:p-5" novalidate @submit.prevent="c.handleSubmit">
    <Alert v-if="c.error.value" variant="error">{{ c.error.value }}</Alert>
    <Alert v-if="c.saved.value && !c.error.value" variant="success">{{ c.saved.value }}</Alert>
    <Alert v-if="recorder.error.value" variant="error">{{ recorder.error.value }}</Alert>

    <input
      v-model="c.title.value"
      aria-label="Título"
      placeholder="Título de la nota"
      :maxlength="TITLE_MAX_LENGTH"
      :disabled="c.busy.value"
      class="w-full border-0 border-b border-line bg-transparent px-0 py-1.5 text-base font-semibold text-fg outline-none placeholder:text-fg-dim focus:border-accent disabled:text-fg-dim"
    />
    <textarea
      v-model="c.content.value"
      aria-label="Contenido"
      placeholder="Escribí tu nota… o grabá un audio."
      rows="3"
      :disabled="c.busy.value"
      class="w-full resize-y border-0 bg-transparent px-0 py-1 text-sm text-fg-soft outline-none placeholder:text-fg-dim disabled:text-fg-dim"
    />

    <RecordingBar
      v-if="c.recording.value"
      :elapsed-ms="recorder.elapsedMs.value"
      :level="recorder.level.value"
      @cancel="recorder.cancel"
      @stop="recorder.stop"
    />

    <div class="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
      <div class="flex flex-wrap items-center gap-2">
        <p v-if="recorder.permission.value === 'unsupported'" class="text-xs text-fg-muted">
          {{ MIC_UNSUPPORTED_MESSAGE }}
        </p>
        <button
          v-else-if="recorder.permission.value !== 'granted' && !c.recording.value"
          type="button"
          :disabled="c.busy.value || recorder.status.value === 'requesting'"
          :class="SECONDARY_BUTTON"
          @click="recorder.requestPermission()"
        >
          <Icon name="mic" svg-class="h-4 w-4" :stroke-width="1.8" />
          {{ recorder.permission.value === 'denied' ? 'Reintentar permiso de micrófono' : 'Activar micrófono' }}
        </button>

        <button
          v-if="recorder.permission.value !== 'unsupported' && !c.recording.value"
          type="button"
          :disabled="c.busy.value || recorder.status.value === 'requesting'"
          class="inline-flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-danger-strong disabled:cursor-not-allowed disabled:bg-danger/40"
          @click="recorder.start()"
        >
          <span class="h-2.5 w-2.5 rounded-full bg-white" aria-hidden="true" />
          Grabar nota de voz
        </button>

        <button
          v-if="c.pendingAudio.value && !c.busy.value && !c.recording.value"
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent/10"
          @click="c.saveNote(c.pendingAudio.value)"
        >
          Reintentar subida
        </button>

        <span v-if="c.busy.value" class="inline-flex items-center gap-2 text-sm text-fg-muted" role="status">
          <Spinner svg-class="h-4 w-4 text-accent" />
          {{ phaseLabel(c.phase.value) }}
        </span>
      </div>

      <button
        type="submit"
        :disabled="!c.canSaveText.value"
        class="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-ink shadow-glow transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-accent/30 disabled:text-ink/50 disabled:shadow-none"
      >
        Guardar nota
      </button>
    </div>
  </form>
</template>
