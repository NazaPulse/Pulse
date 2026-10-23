<script setup lang="ts">
import { formatDateTime } from '@shared/format'

import { resolveMediaUrl } from '../../lib/api'
import type { Note } from '../../types/productivity'
import IconButton from '../IconButton.vue'

defineProps<{ note: Note }>()
const emit = defineEmits<{ delete: [note: Note] }>()
</script>

<template>
  <article class="flex flex-col gap-3 pulse-card p-4">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <h3 class="break-words font-semibold text-fg">{{ note.title }}</h3>
        <p class="mt-0.5 text-xs text-fg-dim">{{ formatDateTime(note.created_at) }}</p>
      </div>
      <IconButton
        icon="trash"
        :label="`Eliminar &quot;${note.title}&quot;`"
        tone="danger"
        @click="emit('delete', note)"
      />
    </div>

    <p v-if="note.content" class="whitespace-pre-line break-words text-sm text-fg-soft">
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
