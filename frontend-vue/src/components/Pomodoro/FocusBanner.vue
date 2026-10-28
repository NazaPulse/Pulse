<script setup lang="ts">
import { durationLabel } from '@shared/schedule'
import type { FocusTarget } from '@shared/schedule'
import Icon from '../Icon.vue'

/** Bloque del Cronograma al que se imputan los Pomodoros de trabajo. */
defineProps<{ target: FocusTarget }>()
defineEmits<{ clear: [] }>()
</script>

<template>
  <div class="flex items-center gap-3 rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2.5">
    <Icon name="focus" svg-class="h-5 w-5 shrink-0 text-accent" />
    <div class="min-w-0 flex-1">
      <p class="eyebrow">Enfocado en</p>
      <p class="truncate text-sm font-semibold text-fg">{{ target.title }}</p>
      <p class="font-mono text-[0.6875rem] text-fg-muted">{{ durationLabel(target.actualMinutes) }} reales registrados</p>
    </div>
    <button
      type="button"
      aria-label="Dejar de enfocar este bloque"
      class="rounded-lg p-1.5 text-fg-dim transition hover:bg-white/10 hover:text-accent"
      @click="$emit('clear')"
    >
      <Icon name="close" svg-class="h-4 w-4" />
    </button>
  </div>
</template>
