<script setup lang="ts">
import type { TaskPriority } from '../../types/productivity'
import { PRIORITY_LABELS } from './priority'

defineProps<{ priority: TaskPriority }>()

const STYLES: Record<TaskPriority, string> = {
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  medium: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  high: 'bg-red-50 text-red-700 ring-red-600/20',
}

const DOTS: Record<TaskPriority, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
      STYLES[priority],
    ]"
  >
    <span :class="['h-1.5 w-1.5 rounded-full', DOTS[priority]]" aria-hidden="true" />
    {{ PRIORITY_LABELS[priority] }}
  </span>
</template>
