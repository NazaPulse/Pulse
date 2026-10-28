import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { formatClock } from '@shared/format'
import { ChimePlayer, completionMessage, pomodoroTabTitle } from '@shared/pomodoro'
import { interruptedFocusMinutes } from '@shared/schedule'
import type { PomodoroMode } from '@shared/pomodoro'
import { useFocusTarget } from './useFocusTarget'
import { usePomodoro } from './usePomodoro'

/** Reloj + aviso sonoro + mensaje de fin de bloque + título de la pestaña + bloque enfocado. */
export function usePomodoroSession() {
  const chime = new ChimePlayer()
  const message = ref<string | null>(null)
  const focus = useFocusTarget()

  const timer = usePomodoro({
    onComplete: (finished, next) => {
      chime.play()
      const text = completionMessage(finished, next)
      message.value = text
      if (finished !== 'work') return
      void focus.recordSession().then((recorded) => {
        if (recorded) message.value = `${text} ${recorded}`
      })
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

  /** Un bloque de trabajo interrumpido (reinicio o cambio de modo) también suma sus minutos. */
  function recordInterrupted() {
    if (timer.mode.value !== 'work') return
    const minutes = interruptedFocusMinutes(timer.durationMs.value - timer.remainingMs.value)
    void focus.recordSession(minutes).then((recorded) => {
      if (recorded) message.value = recorded
    })
  }

  onBeforeUnmount(() => {
    document.title = originalTitle
    chime.dispose()
  })

  return {
    timer,
    clock,
    message,
    focus,
    start() {
      chime.unlock()
      message.value = null
      timer.start()
    },
    selectMode(mode: PomodoroMode) {
      message.value = null
      recordInterrupted()
      timer.selectMode(mode)
    },
    reset() {
      message.value = null
      recordInterrupted()
      timer.reset()
    },
  }
}
