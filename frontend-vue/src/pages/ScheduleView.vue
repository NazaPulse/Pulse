<script setup lang="ts">
import { computed } from 'vue'

import { conflictsLabel, dayTitle, taskDuration, updateWorkHours, weekTitle } from '@shared/schedule'
import type { BlockSpan, WorkHours } from '@shared/schedule'
import Alert from '../components/Alert.vue'
import ErrorNotice from '../components/ErrorNotice.vue'
import Icon from '../components/Icon.vue'
import LoadingBlock from '../components/LoadingBlock.vue'
import PageHeader from '../components/PageHeader.vue'
import BlockEditorModal from '../components/Schedule/BlockEditorModal.vue'
import DaySummary from '../components/Schedule/DaySummary.vue'
import GanttTimeline from '../components/Schedule/GanttTimeline.vue'
import ScheduleSidebar from '../components/Schedule/ScheduleSidebar.vue'
import ScheduleToolbar from '../components/Schedule/ScheduleToolbar.vue'
import UndoToast from '../components/Schedule/UndoToast.vue'
import WeekView from '../components/Schedule/WeekView.vue'
import { useSchedule } from '../composables/useSchedule'
import type { TimeBlock } from '../types/productivity'

const NAV_BUTTON =
  'rounded-lg border border-line-strong bg-white/[0.03] px-3 py-2 text-sm font-medium text-fg-soft transition hover:border-accent/50 hover:text-accent'

const s = useSchedule()
const isWeek = computed(() => s.prefs.value.mode === 'week')
const unit = computed(() => (isWeek.value ? 'Semana' : 'Día'))
const selectedTask = computed(() => (s.selectedTaskId.value ? s.tasksById.value.get(s.selectedTaskId.value) : undefined))
const editorConflict = computed(() => {
  const block = s.editor.value?.block
  return block ? s.conflicts.value.has(block.id) : false
})

function onWorkHours(edge: keyof WorkHours, minute: number) {
  s.setPrefs({ workHours: updateWorkHours(s.prefs.value.workHours, edge, minute) })
}

function onPlaceTask(taskId: string | null, minute: number) {
  const id = taskId ?? s.selectedTaskId.value
  if (id) void s.placeTask(id, minute)
}

const onCreateSpan = (span: BlockSpan) => s.openEditor({ block: null, span })
const onOpen = (block: TimeBlock) => s.openEditor({ block })
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
    <PageHeader
      eyebrow="05 · Agenda"
      title="Cronograma"
      subtitle="Arrastrá tareas o arrastrá sobre la grilla para crear bloques; agendá automáticamente y compará lo planificado con el tiempo real."
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <button type="button" :aria-label="`${unit} anterior`" :class="NAV_BUTTON" @click="s.goToDay(-1)">
            <Icon name="chevronLeft" svg-class="h-4 w-4" />
          </button>
          <button
            type="button"
            :disabled="s.isToday.value"
            :class="[NAV_BUTTON, 'disabled:opacity-40']"
            @click="s.goToToday"
          >
            Hoy
          </button>
          <button type="button" :aria-label="`${unit} siguiente`" :class="NAV_BUTTON" @click="s.goToDay(1)">
            <Icon name="chevronRight" svg-class="h-4 w-4" />
          </button>
        </div>
      </template>
    </PageHeader>

    <div class="mt-6">
      <ScheduleToolbar
        :prefs="s.prefs.value"
        :busy="s.busy.value"
        @prefs="s.setPrefs"
        @work-hours="onWorkHours"
        @auto-schedule="s.autoScheduleDay"
        @copy-previous-day="s.copyPreviousDay"
      />
    </div>

    <ErrorNotice :message="s.error.value" />
    <div v-if="s.notice.value" class="mt-4 flex items-start gap-2">
      <div class="flex-1">
        <Alert variant="success">{{ s.notice.value }}</Alert>
      </div>
      <button type="button" aria-label="Cerrar aviso" class="rounded p-2 text-fg-dim hover:text-fg" @click="s.dismissNotice">
        <Icon name="close" svg-class="h-4 w-4" />
      </button>
    </div>

    <div class="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
      <ScheduleSidebar
        :tasks="s.pending.value"
        :scheduled-ids="s.scheduledIds.value"
        :selected-id="s.selectedTaskId.value"
        :open="s.prefs.value.sidebarOpen"
        @toggle="s.setPrefs({ sidebarOpen: !s.prefs.value.sidebarOpen })"
        @select="s.selectTask"
      />

      <div class="flex min-w-0 flex-1 flex-col gap-4">
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

        <DaySummary
          v-if="!isWeek && !s.loading.value"
          :rows="s.summary.value.rows"
          :planned="s.summary.value.planned"
          :actual="s.summary.value.actual"
          :adherence="s.summary.value.adherence"
        />

        <p v-if="!isWeek" class="text-xs text-fg-dim">
          Teclado: Tab para elegir un bloque · ←/→ mover 15 min · Shift+←/→ ajustar el fin · Alt+←/→ ajustar el inicio ·
          Enter editar · Supr eliminar.
        </p>
      </div>
    </div>

    <BlockEditorModal
      v-if="s.editor.value"
      :block="s.editor.value.block"
      :span="s.editor.value.span"
      :day="s.day.value"
      :conflict="editorConflict"
      :tasks-by-id="s.tasksById.value"
      :on-save="s.saveEditor"
      @close="s.closeEditor"
      @delete="s.remove"
      @focus="s.focus"
      @move-to-next-slot="s.moveToNextSlot"
      @push-following="s.pushFollowing"
    />

    <UndoToast v-if="s.undo.value" :action="s.undo.value" @undo="s.runUndo" @dismiss="s.dismissUndo" />
  </section>
</template>
