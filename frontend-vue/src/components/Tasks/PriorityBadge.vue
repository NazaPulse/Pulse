<script setup lang="ts">
import { PRIORITY_BADGE, PRIORITY_LABELS } from '@shared/tasks'
import type { TaskPriority } from '../../types/productivity'

defineProps<{ priority: TaskPriority }>()
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
      PRIORITY_BADGE[priority].chip,
    ]"
  >
    <span :class="['h-1.5 w-1.5 rounded-full', PRIORITY_BADGE[priority].dot]" aria-hidden="true" />
    {{ PRIORITY_LABELS[priority] }}
  </span>
</template>
