<script setup lang="ts">
import { computed } from 'vue'

import { TASK_DRAG_MIME, durationLabel, taskDuration } from '@shared/schedule'
import { PRIORITY_LABELS } from '@shared/tasks'
import type { Task } from '../../types/productivity'
import Icon from '../Icon.vue'

/**
 * Panel plegable con las tareas pendientes. Se arrastran a la grilla (mouse) o se tocan y luego
 * se toca una hora ("tocar y ubicar", pensado para pantallas táctiles).
 */
const props = defineProps<{
  tasks: Task[]
  scheduledIds: ReadonlySet<string>
  selectedId: string | null
  open: boolean
}>()
const emit = defineEmits<{ toggle: []; select: [id: string | null] }>()

const selected = computed(() => props.tasks.find((task) => task.id === props.selectedId))

function onDragStart(event: DragEvent, task: Task) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData(TASK_DRAG_MIME, task.id)
  event.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <aside
    aria-label="Tareas pendientes"
    :class="[
      'pulse-card flex shrink-0 flex-col transition-[width] duration-300',
      open ? 'w-full lg:w-72' : 'w-full lg:w-14',
    ]"
  >
    <div class="flex items-center justify-between gap-2 border-b border-line px-3 py-3">
      <p v-if="open" class="eyebrow">Pendientes · {{ tasks.length }}</p>
      <button
        type="button"
        :aria-expanded="open"
        :aria-label="open ? 'Plegar panel de tareas' : 'Desplegar panel de tareas'"
        class="rounded-lg p-1.5 text-fg-dim transition hover:bg-white/10 hover:text-accent"
        @click="emit('toggle')"
      >
        <Icon :name="open ? 'chevronLeft' : 'chevronRight'" svg-class="h-4 w-4" />
      </button>
    </div>

    <div
      v-if="open && selected"
      role="status"
      class="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent"
    >
      <span class="min-w-0 flex-1">
        Tocá una hora de la grilla para ubicar <strong class="text-fg">«{{ selected.title }}»</strong>.
      </span>
      <button type="button" class="font-semibold underline-offset-2 hover:underline" @click="emit('select', null)">
        Cancelar
      </button>
    </div>

    <ul v-if="open" class="flex max-h-[28rem] flex-col gap-2 overflow-y-auto p-3">
      <li v-if="tasks.length === 0" class="pulse-empty text-sm">No tenés tareas pendientes.</li>
      <li v-for="task in tasks" v-else :key="task.id">
        <button
          type="button"
          draggable="true"
          :aria-pressed="task.id === selectedId"
          :class="[
            'flex w-full cursor-grab items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition active:cursor-grabbing',
            task.id === selectedId
              ? 'border-accent bg-accent/15 text-fg shadow-glow-sm'
              : 'border-line bg-white/[0.03] text-fg-soft hover:border-accent/50 hover:text-fg',
          ]"
          @click="emit('select', task.id)"
          @dragstart="onDragStart($event, task)"
        >
          <Icon name="grip" svg-class="h-4 w-4 shrink-0 text-fg-dim" :stroke-width="3" />
          <span class="min-w-0 flex-1">
            <span class="block truncate">{{ task.title }}</span>
            <span class="mt-0.5 flex flex-wrap gap-x-2 font-mono text-[0.625rem] uppercase tracking-wider text-fg-dim">
              <span>{{ PRIORITY_LABELS[task.priority] }}</span>
              <span>{{ durationLabel(taskDuration(task)) }}</span>
              <span v-if="scheduledIds.has(task.id)" class="text-ok">Agendada</span>
            </span>
          </span>
        </button>
      </li>
    </ul>

    <p v-if="open" class="mt-auto border-t border-line px-3 py-2.5 text-xs text-fg-dim">
      Arrastrá una tarea a la grilla, o tocála y después tocá una hora.
    </p>
  </aside>
</template>
