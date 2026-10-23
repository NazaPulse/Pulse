import { computed, onBeforeUnmount, ref, watch } from 'vue'

import * as pomodoro from '@shared/pomodoro'
import type { PomodoroMode, TimerState } from '@shared/pomodoro'

export interface UsePomodoroOptions {
  /** Se invoca una vez al terminar cada bloque (también si la pestaña estaba oculta). */
  onComplete?: (finished: PomodoroMode, next: PomodoroMode) => void
}

export function usePomodoro({ onComplete }: UsePomodoroOptions = {}) {
  const state = ref<TimerState>(pomodoro.loadTimerState())
  const now = ref(Date.now())
  const running = computed(() => pomodoro.isRunning(state.value))
  const remainingMs = computed(() => pomodoro.remainingMs(state.value, now.value))

  watch(state, (value) => pomodoro.saveTimerState(value), { deep: true })

  // El intervalo solo refresca `now`; su frecuencia real no afecta al cálculo.
  const sync = () => {
    now.value = Date.now()
  }
  let interval: number | null = null

  function stopTicking() {
    if (interval !== null) window.clearInterval(interval)
    interval = null
    document.removeEventListener('visibilitychange', sync)
  }

  watch(
    running,
    (active) => {
      stopTicking()
      if (!active) return
      interval = window.setInterval(sync, pomodoro.TICK_MS)
      document.addEventListener('visibilitychange', sync)
    },
    { immediate: true },
  )
  onBeforeUnmount(stopTicking)

  watch(
    remainingMs,
    (remaining) => {
      if (!running.value || remaining > 0) return
      const done = pomodoro.completeBlock(state.value)
      state.value = done.state
      onComplete?.(done.finished, done.next)
    },
    { immediate: true },
  )

  function apply(change: (current: TimerState, at: number) => TimerState) {
    const at = Date.now()
    now.value = at
    state.value = change(state.value, at)
  }

  return {
    mode: computed(() => state.value.mode),
    running,
    durationMs: computed(() => pomodoro.durationOf(state.value)),
    remainingMs,
    progress: computed(() => pomodoro.progressOf(state.value, now.value)),
    completedWorkSessions: computed(() => state.value.completedWorkSessions),
    pristine: computed(() => !running.value && state.value.accumulatedMs === 0),
    status: computed(() => pomodoro.statusLabel(state.value)),
    start: () => apply(pomodoro.startTimer),
    pause: () => apply(pomodoro.pauseTimer),
    reset: () => apply(pomodoro.resetTimer),
    selectMode: (mode: PomodoroMode) => apply((current) => pomodoro.selectTimerMode(current, mode)),
  }
}

export type PomodoroTimer = ReturnType<typeof usePomodoro>
