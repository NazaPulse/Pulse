import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'

import { formatClock } from '@shared/format'
import { ChimePlayer, completionMessage, pomodoroTabTitle } from '@shared/pomodoro'
import { interruptedFocusMinutes } from '@shared/schedule'
import type { PomodoroMode } from '@shared/pomodoro'
import { useFocusTarget } from './useFocusTarget'
import { usePomodoro } from './usePomodoro'

type FocusTarget = ReturnType<typeof useFocusTarget>
type Timer = ReturnType<typeof usePomodoro>
type MessageRef = Ref<string | null>

/** Fin de bloque: suena el aviso, se muestra el mensaje y un bloque de trabajo suma minutos al foco. */
function completionHandler(chime: ChimePlayer, message: MessageRef, focus: FocusTarget) {
  return (finished: PomodoroMode, next: PomodoroMode) => {
    chime.play()
    const text = completionMessage(finished, next)
    message.value = text
    if (finished !== 'work') return
    void focus.recordSession().then((recorded) => {
      if (recorded) message.value = `${text} ${recorded}`
    })
  }
}

/** Mientras corre, la pestaña muestra el tiempo restante; al terminar (o desmontar) vuelve el título original. */
function useTabTitle(clock: Ref<string>, timer: Timer, chime: ChimePlayer) {
  const originalTitle = document.title
  watch(
    [clock, timer.running, timer.mode],
    () => {
      document.title = timer.running.value ? pomodoroTabTitle(clock.value, timer.mode.value) : originalTitle
    },
    { immediate: true },
  )
  onBeforeUnmount(() => {
    document.title = originalTitle
    chime.dispose()
  })
}

/** Un bloque de trabajo interrumpido (reinicio o cambio de modo) también suma sus minutos. */
function recordInterrupted(timer: Timer, focus: FocusTarget, message: MessageRef) {
  if (timer.mode.value !== 'work') return
  const minutes = interruptedFocusMinutes(timer.durationMs.value - timer.remainingMs.value)
  void focus.recordSession(minutes).then((recorded) => {
    if (recorded) message.value = recorded
  })
}

type Session = { timer: Timer; focus: FocusTarget; chime: ChimePlayer; message: MessageRef }

function sessionControls({ timer, focus, chime, message }: Session) {
  return {
    start() {
      chime.unlock()
      message.value = null
      timer.start()
    },
    selectMode(mode: PomodoroMode) {
      message.value = null
      recordInterrupted(timer, focus, message)
      timer.selectMode(mode)
    },
    reset() {
      message.value = null
      recordInterrupted(timer, focus, message)
      timer.reset()
    },
  }
}

/** Reloj + aviso sonoro + mensaje de fin de bloque + título de la pestaña + bloque enfocado. */
export function usePomodoroSession() {
  const chime = new ChimePlayer()
  const message = ref<string | null>(null)
  const focus = useFocusTarget()
  const timer = usePomodoro({ onComplete: completionHandler(chime, message, focus) })
  const clock = computed(() => formatClock(timer.remainingMs.value))
  useTabTitle(clock, timer, chime)

  return { timer, clock, message, focus, ...sessionControls({ timer, focus, chime, message }) }
}
