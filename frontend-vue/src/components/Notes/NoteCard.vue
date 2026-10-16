<script setup lang="ts">
import { formatDateTime } from '@shared/format'

import { resolveMediaUrl } from '../../lib/api'
import type { Note } from '../../types/productivity'

defineProps<{ note: Note }>()

const emit = defineEmits<{ delete: [note: Note] }>()
</script>

<template>
  <article class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <h3 class="break-words font-semibold text-slate-900">{{ note.title }}</h3>
        <p class="mt-0.5 text-xs text-slate-400">{{ formatDateTime(note.created_at) }}</p>
      </div>
      <button
        type="button"
        :aria-label="`Eliminar &quot;${note.title}&quot;`"
        class="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        @click="emit('delete', note)"
      >
        <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4">
          <path
            d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <p v-if="note.content" class="whitespace-pre-line break-words text-sm text-slate-600">
      {{ note.content }}
    </p>

    <audio
      v-if="note.audio_url"
      controls
      preload="metadata"
      :src="resolveMediaUrl(note.audio_url)"
      class="w-full"
    >
      Tu navegador no soporta la reproducción de audio.
    </audio>
  </article>
</template>
