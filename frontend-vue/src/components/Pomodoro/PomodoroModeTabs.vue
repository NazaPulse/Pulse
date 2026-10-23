<script setup lang="ts">
import { MODE_DURATIONS_MS, MODE_LABELS, MODE_STYLES, POMODORO_MODES } from '@shared/pomodoro'
import type { PomodoroMode } from '@shared/pomodoro'

defineProps<{ mode: PomodoroMode }>()
const emit = defineEmits<{ select: [mode: PomodoroMode] }>()
</script>

<template>
  <div class="grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1" role="tablist">
    <button
      v-for="value in POMODORO_MODES"
      :key="value"
      type="button"
      role="tab"
      :aria-selected="mode === value"
      :class="[
        'rounded-md px-2 py-2 text-xs font-semibold transition sm:text-sm',
        mode === value ? MODE_STYLES[value].tab : 'text-fg-soft hover:text-fg',
      ]"
      @click="emit('select', value)"
    >
      {{ MODE_LABELS[value] }}
      <span class="block text-[11px] font-normal opacity-80">
        {{ MODE_DURATIONS_MS[value] / 60_000 }} min
      </span>
    </button>
  </div>
</template>
