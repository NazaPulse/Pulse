<script setup lang="ts">
import { updateWorkHours } from '@shared/schedule'
import type { WorkHours } from '@shared/schedule'
import ErrorNotice from '../components/ErrorNotice.vue'
import PageHeader from '../components/PageHeader.vue'
import ScheduleCalendar from '../components/Schedule/ScheduleCalendar.vue'
import ScheduleDayFooter from '../components/Schedule/ScheduleDayFooter.vue'
import ScheduleEditor from '../components/Schedule/ScheduleEditor.vue'
import ScheduleNav from '../components/Schedule/ScheduleNav.vue'
import ScheduleNotice from '../components/Schedule/ScheduleNotice.vue'
import ScheduleSidebar from '../components/Schedule/ScheduleSidebar.vue'
import ScheduleToolbar from '../components/Schedule/ScheduleToolbar.vue'
import UndoToast from '../components/Schedule/UndoToast.vue'
import { useSchedule } from '../composables/useSchedule'

const s = useSchedule()

function onWorkHours(edge: keyof WorkHours, minute: number) {
  s.setPrefs({ workHours: updateWorkHours(s.prefs.value.workHours, edge, minute) })
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
    <PageHeader
      eyebrow="05 · Agenda"
      title="Cronograma"
      subtitle="Arrastrá tareas o arrastrá sobre la grilla para crear bloques; agendá automáticamente y compará lo planificado con el tiempo real."
    >
      <template #actions>
        <ScheduleNav :s="s" />
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
    <ScheduleNotice :s="s" />

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
        <ScheduleCalendar :s="s" />
        <ScheduleDayFooter :s="s" />
      </div>
    </div>

    <ScheduleEditor :s="s" />

    <UndoToast v-if="s.undo.value" :action="s.undo.value" @undo="s.runUndo" @dismiss="s.dismissUndo" />
  </section>
</template>
