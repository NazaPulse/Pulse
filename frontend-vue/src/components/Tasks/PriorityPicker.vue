<script setup lang="ts">
import { PRIORITY_LABELS, PRIORITY_OPTIONS } from '@shared/tasks'
import type { TaskPriority } from '../../types/productivity'

defineProps<{ disabled: boolean }>()
const model = defineModel<TaskPriority>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-sm font-medium text-fg-soft">Prioridad</span>
    <div class="grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1" role="radiogroup">
      <button
        v-for="option in PRIORITY_OPTIONS"
        :key="option.value"
        type="button"
        role="radio"
        :aria-checked="model === option.value"
        :disabled="disabled"
        :class="[
          'rounded-md px-3 py-2 text-sm font-semibold transition',
          model === option.value ? option.active : 'text-fg-soft hover:text-fg',
        ]"
        @click="model = option.value"
      >
        {{ PRIORITY_LABELS[option.value] }}
      </button>
    </div>
  </div>
</template>
