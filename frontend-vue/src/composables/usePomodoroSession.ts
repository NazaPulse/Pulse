import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { formatClock } from '@shared/format'
import { ChimePlayer, completionMessage, pomodoroTabTitle } from '@shared/pomodoro'
import type { PomodoroMode } from '@shared/pomodoro'
import { usePomodoro } from './usePomodoro'

/** Reloj + aviso sonoro + mensaje de fin de bloque + título de la pestaña. */
export function usePomodoroSession() {
  const chime = new ChimePlayer()
  const message = ref<string | null>(null)

  const timer = usePomodoro({
    onComplete: (finished, next) => {
      chime.play()
      message.value = completionMessage(finished, next)
    },
  })
  const clock = computed(() => formatClock(timer.remainingMs.value))

  const originalTitle = document.title
  watch(
    [clock, timer.running, timer.mode],
    () => {
      document.title = timer.running.value
        ? pomodoroTabTitle(clock.value, timer.mode.value)
        : originalTitle
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    document.title = originalTitle
    chime.dispose()
  })

  return {
    timer,
    clock,
    message,
    start() {
      chime.unlock()
      message.value = null
      timer.start()
    },
    selectMode(mode: PomodoroMode) {
      message.value = null
      timer.selectMode(mode)
    },
    reset() {
      message.value = null
      timer.reset()
    },
  }
}
