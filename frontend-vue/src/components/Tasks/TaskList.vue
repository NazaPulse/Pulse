<script setup lang="ts">
import { dueLabel } from '@shared/tasks'

import type { Task } from '../../types/productivity'
import IconButton from '../IconButton.vue'
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
</script>

<template>
  <div v-if="tasks.length === 0" class="pulse-empty px-6 py-10 text-center text-sm text-fg-muted">
    {{ emptyMessage }}
  </div>

  <ul v-else class="divide-y divide-line overflow-hidden pulse-card">
    <li v-for="task in tasks" :key="task.id" class="flex items-start gap-3 px-4 py-3.5 sm:px-5">
      <input
        :id="`task-${task.id}`"
        type="checkbox"
        :checked="task.status === 'completed'"
        :disabled="togglingIds.has(task.id)"
        :aria-busy="togglingIds.has(task.id)"
        class="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line-strong accent-accent disabled:cursor-wait disabled:opacity-60"
        @change="emit('toggle', task)"
      />

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <label
            :for="`task-${task.id}`"
            :class="[
              'cursor-pointer break-words text-sm font-medium',
              task.status === 'completed' ? 'text-fg-dim line-through' : 'text-fg',
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
            task.status === 'completed' ? 'text-fg-dim' : 'text-fg-soft',
          ]"
        >
          {{ task.description }}
        </p>
        <p
          v-if="dueLabel(task, now)"
          :class="[
            'mt-1.5 text-xs',
            dueLabel(task, now)?.overdue ? 'font-medium text-danger-soft' : 'text-fg-muted',
          ]"
        >
          {{ dueLabel(task, now)?.text }}
        </p>
      </div>

      <IconButton
        icon="trash"
        :label="`Eliminar &quot;${task.title}&quot;`"
        tone="danger"
        @click="emit('delete', task)"
      />
    </li>
  </ul>
</template>
