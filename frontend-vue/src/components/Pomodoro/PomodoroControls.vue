<script setup lang="ts">
import { MODE_STYLES } from '@shared/pomodoro'
import type { PomodoroMode } from '@shared/pomodoro'

defineProps<{ mode: PomodoroMode; running: boolean; pristine: boolean }>()
const emit = defineEmits<{ start: []; pause: []; reset: [] }>()
</script>

<template>
  <div class="flex justify-center gap-3">
    <button
      v-if="running"
      type="button"
      class="min-w-32 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-white/15"
      @click="emit('pause')"
    >
      Pausar
    </button>
    <button
      v-else
      type="button"
      :class="[
        'min-w-32 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition',
        MODE_STYLES[mode].button,
      ]"
      @click="emit('start')"
    >
      {{ pristine ? 'Iniciar' : 'Reanudar' }}
    </button>
    <button
      type="button"
      :disabled="pristine"
      class="rounded-lg border border-line-strong bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-fg-soft transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
      @click="emit('reset')"
    >
      Reiniciar
    </button>
  </div>
</template>
