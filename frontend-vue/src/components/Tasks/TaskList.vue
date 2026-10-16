<script setup lang="ts">
import { formatDateTime } from '@shared/format'

import type { Task } from '../../types/productivity'
import PriorityBadge from './PriorityBadge.vue'

defineProps<{
  tasks: Task[]
  /** Ids con un cambio de estado en curso (deshabilita su checkbox). */
  togglingIds: ReadonlySet<string>
  emptyMessage: string
  /** Instante de referencia para marcar tareas vencidas. */
  now: number
}>()

const emit = defineEmits<{ toggle: [task: Task]; delete: [task: Task] }>()

function isOverdue(task: Task, now: number): boolean {
  return (
    task.status !== 'completed' &&
    task.due_date !== null &&
    new Date(task.due_date).getTime() < now
  )
}
</script>

<template>
  <div
    v-if="tasks.length === 0"
    class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500"
  >
    {{ emptyMessage }}
  </div>

  <ul
    v-else
    class="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
  >
    <li v-for="task in tasks" :key="task.id" class="flex items-start gap-3 px-4 py-3.5 sm:px-5">
      <input
        :id="`task-${task.id}`"
        type="checkbox"
        :checked="task.status === 'completed'"
        :disabled="togglingIds.has(task.id)"
        :aria-busy="togglingIds.has(task.id)"
        class="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600 disabled:cursor-wait disabled:opacity-60"
        @change="emit('toggle', task)"
      />

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <label
            :for="`task-${task.id}`"
            :class="[
              'cursor-pointer break-words text-sm font-medium',
              task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900',
            ]"
          >
            {{ task.title }}
          </label>
          <PriorityBadge :priority="task.priority" />
        </div>
        <p
          v-if="task.description"
          :class="[
            'mt-1 whitespace-pre-line break-words text-sm',
            task.status === 'completed' ? 'text-slate-400' : 'text-slate-600',
          ]"
        >
          {{ task.description }}
        </p>
        <p
          v-if="task.due_date"
          :class="[
            'mt-1.5 text-xs',
            isOverdue(task, now) ? 'font-medium text-red-600' : 'text-slate-500',
          ]"
        >
          {{ isOverdue(task, now) ? 'Vencida · ' : 'Vence ' }}{{ formatDateTime(task.due_date) }}
        </p>
      </div>

      <button
        type="button"
        :aria-label="`Eliminar &quot;${task.title}&quot;`"
        class="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        @click="emit('delete', task)"
      >
        <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4">
          <path
            d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </li>
  </ul>
</template>
