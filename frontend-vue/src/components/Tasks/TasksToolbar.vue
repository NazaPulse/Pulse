<script setup lang="ts">
import { PRIORITY_FILTERS, TASK_FILTERS, TASK_SORTS } from '@shared/tasks'
import type { PriorityFilter, SortKey, StatusFilter, TaskView } from '@shared/tasks'

const SELECT_CLASS =
  'rounded-lg border border-line-strong bg-canvas/60 px-3 py-1.5 text-sm text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'

/** Pestañas de estado con contador, filtro de prioridad y selector de orden. */
defineProps<{ view: TaskView; counts: Record<StatusFilter, number> }>()
const emit = defineEmits<{ change: [patch: Partial<TaskView>] }>()

const selected = (event: Event) => (event.target as HTMLSelectElement).value
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex gap-1 rounded-lg bg-white/10 p-1" role="tablist">
      <button
        v-for="option in TASK_FILTERS"
        :key="option.value"
        type="button"
        role="tab"
        :aria-selected="view.status === option.value"
        :class="[
          'rounded-md px-3 py-1.5 text-sm font-medium transition',
          view.status === option.value
            ? 'bg-accent/15 text-accent ring-1 ring-inset ring-accent/30'
            : 'text-fg-soft hover:text-fg',
        ]"
        @click="emit('change', { status: option.value })"
      >
        {{ option.label }}
        <span class="ml-1.5 text-xs text-fg-dim">{{ counts[option.value] }}</span>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-sm text-fg-soft">
        Prioridad
        <select
          :value="view.priority"
          :class="SELECT_CLASS"
          @change="emit('change', { priority: selected($event) as PriorityFilter })"
        >
          <option v-for="option in PRIORITY_FILTERS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm text-fg-soft">
        Ordenar por
        <select
          :value="view.sort"
          :class="SELECT_CLASS"
          @change="emit('change', { sort: selected($event) as SortKey })"
        >
          <option v-for="option in TASK_SORTS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>
  </div>
</template>
