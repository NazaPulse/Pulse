<script setup lang="ts">
import * as schedule from '@shared/schedule'

/** Línea de "ahora" sobre la grilla. */
defineProps<{ minute: number; left: string }>()
</script>

<template>
  <div
    class="pointer-events-none absolute -top-8 bottom-0 z-30 w-0.5 -translate-x-1/2 bg-accent shadow-glow-sm"
    :style="{ left }"
    aria-hidden="true"
  >
    <span
      class="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 animate-blink rounded-full bg-accent shadow-glow-sm"
    />
    <span
      class="absolute left-2 top-0 rounded bg-accent px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold text-ink"
    >
      {{ schedule.formatMinute(minute) }}
    </span>
  </div>
</template>
