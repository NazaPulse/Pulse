<script setup lang="ts">
import type { UndoAction } from '@shared/schedule'
import Icon from '../Icon.vue'

/** Aviso temporal con "Deshacer" tras crear, mover, redimensionar o eliminar bloques. */
defineProps<{ action: UndoAction }>()
const emit = defineEmits<{ undo: []; dismiss: [] }>()
</script>

<template>
  <div
    role="status"
    class="fixed bottom-24 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-rise items-center gap-3 rounded-xl border border-accent/40 bg-surface/95 px-4 py-3 text-sm text-fg shadow-glow backdrop-blur lg:bottom-6"
  >
    <span class="min-w-0 flex-1 truncate">{{ action.message }}</span>
    <button type="button" class="font-semibold text-accent underline-offset-2 hover:underline" @click="emit('undo')">
      Deshacer
    </button>
    <button type="button" aria-label="Cerrar aviso" class="rounded p-1 text-fg-dim hover:text-fg" @click="emit('dismiss')">
      <Icon name="close" svg-class="h-4 w-4" />
    </button>
  </div>
</template>
