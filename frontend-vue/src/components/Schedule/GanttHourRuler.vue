<script setup lang="ts">
import { computed } from 'vue'

import * as schedule from '@shared/schedule'
import type { BlockSpan } from '@shared/schedule'

/** Regla de horas sobre la grilla. */
const props = defineProps<{ view: BlockSpan }>()

const marks = computed(() => schedule.hourMarks(props.view))

function markClass(minute: number) {
  if (minute === props.view.end) return '-translate-x-full'
  return minute === props.view.start ? '' : '-translate-x-1/2'
}
</script>

<template>
  <div class="relative h-8 border-b border-line">
    <span
      v-for="minute in marks"
      :key="minute"
      :class="['absolute top-2 font-mono text-[0.625rem] text-fg-dim', markClass(minute)]"
      :style="{ left: schedule.minuteToPercent(minute, view) }"
    >
      {{ schedule.formatMinute(minute) }}
    </span>
  </div>
</template>
