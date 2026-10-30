<script setup lang="ts">
import { computed } from 'vue'

import { conflictsLabel, dayTitle, taskDuration, weekTitle } from '@shared/schedule'
import type { BlockSpan } from '@shared/schedule'
import type { ScheduleApi } from '../../composables/useSchedule'
import type { TimeBlock } from '../../types/productivity'
import LoadingBlock from '../LoadingBlock.vue'
import GanttTimeline from './GanttTimeline.vue'
import WeekView from './WeekView.vue'

/** Tarjeta del calendario: título y leyenda, aviso de conflictos y grilla del día (o la semana). */
const props = defineProps<{ s: ScheduleApi }>()

const isWeek = computed(() => props.s.prefs.value.mode === 'week')
const selectedTask = computed(() => {
  const id = props.s.selectedTaskId.value
  return id ? props.s.tasksById.value.get(id) : undefined
})

function onPlaceTask(taskId: string | null, minute: number) {
  const id = taskId ?? props.s.selectedTaskId.value
  if (id) void props.s.placeTask(id, minute)
}

const onCreateSpan = (span: BlockSpan) => props.s.openEditor({ block: null, span })
const onOpen = (block: TimeBlock) => props.s.openEditor({ block })
</script>

<template>
  <div class="pulse-card min-w-0">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="section-title">{{ isWeek ? weekTitle(s.day.value) : dayTitle(s.day.value) }}</h2>
      <div class="flex items-center gap-4 text-xs text-fg-muted">
        <span class="flex items-center gap-1.5">
          <span class="h-3 w-5 rounded border border-accent/40 bg-accent/10" aria-hidden="true" />
          Planificado
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-1.5 w-5 rounded-full bg-accent shadow-glow-sm" aria-hidden="true" />
          Real
        </span>
      </div>
    </div>

    <p
      v-if="s.conflicts.value.size > 0 && !isWeek"
      role="alert"
      class="mx-4 mt-3 rounded-lg border border-danger-soft/40 bg-danger/10 px-3 py-2 text-xs text-danger-soft"
    >
      {{ conflictsLabel(s.conflicts.value.size) }} Abrí un bloque en conflicto para resolverlo.
    </p>

    <LoadingBlock v-if="s.loading.value" />
    <WeekView
      v-else-if="isWeek"
      :day="s.day.value"
      :blocks="s.blocks.value"
      :conflicts="s.conflicts.value"
      :today="new Date()"
      @open-day="s.openDay"
    />
    <div v-else class="pt-3">
      <GanttTimeline
        :key="`${s.day.value.toISOString()}-${s.prefs.value.zoom}`"
        :day="s.day.value"
        :view="s.view.value"
        :zoom="s.prefs.value.zoom"
        :blocks="s.blocks.value"
        :conflicts="s.conflicts.value"
        :layout="s.layout.value"
        :tasks-by-id="s.tasksById.value"
        :now-minute="s.nowMinute.value"
        :placing-minutes="selectedTask ? taskDuration(selectedTask) : null"
        @place-task="onPlaceTask"
        @create-span="onCreateSpan"
        @commit-span="s.commitSpan"
        @open="onOpen"
        @focus="s.focus"
        @delete="s.remove"
      />
    </div>
  </div>
</template>
