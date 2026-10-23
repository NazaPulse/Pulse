<script setup lang="ts">
import { MODE_STYLES, WORK_SESSIONS_PER_LONG_BREAK, completedSessionsLabel } from '@shared/pomodoro'

import Alert from '../components/Alert.vue'
import PageHeader from '../components/PageHeader.vue'
import PomodoroControls from '../components/Pomodoro/PomodoroControls.vue'
import PomodoroModeTabs from '../components/Pomodoro/PomodoroModeTabs.vue'
import ProgressRing from '../components/Pomodoro/ProgressRing.vue'
import { usePomodoroSession } from '../composables/usePomodoroSession'

const SUBTITLE = `Bloques de 25 minutos de concentración con descansos cortos y, cada ${WORK_SESSIONS_PER_LONG_BREAK} bloques, uno largo.`

const { timer, clock, message, start, selectMode, reset } = usePomodoroSession()
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
    <PageHeader eyebrow="04 · Foco" title="Pomodoro" :subtitle="SUBTITLE" />

    <div class="mx-auto mt-8 flex max-w-md flex-col gap-6 pulse-card p-5 sm:p-8">
      <PomodoroModeTabs :mode="timer.mode.value" @select="selectMode" />

      <Alert v-if="message" variant="success">{{ message }}</Alert>

      <ProgressRing :progress="timer.progress.value" :color-class="MODE_STYLES[timer.mode.value].ring">
        <span class="font-mono text-6xl font-semibold tabular-nums tracking-tight text-fg" aria-live="off">
          {{ clock }}
        </span>
        <span class="mt-1 text-sm text-fg-muted">{{ timer.status.value }}</span>
      </ProgressRing>

      <PomodoroControls
        :mode="timer.mode.value"
        :running="timer.running.value"
        :pristine="timer.pristine.value"
        @start="start"
        @pause="timer.pause"
        @reset="reset"
      />

      <div class="flex flex-col items-center gap-2 border-t border-line pt-4">
        <div class="flex gap-1.5" aria-hidden="true">
          <span
            v-for="i in WORK_SESSIONS_PER_LONG_BREAK"
            :key="i"
            :class="[
              'h-2.5 w-2.5 rounded-full',
              i <= timer.completedWorkSessions.value % WORK_SESSIONS_PER_LONG_BREAK
                ? 'bg-danger-soft'
                : 'bg-white/10',
            ]"
          />
        </div>
        <p class="text-xs text-fg-muted">
          {{ completedSessionsLabel(timer.completedWorkSessions.value) }}
        </p>
      </div>
    </div>
  </section>
</template>
