import { useEffect, useState } from 'react'

import { formatClock } from '@shared/format'
import { ChimePlayer, completionMessage, pomodoroTabTitle } from '@shared/pomodoro'
import { interruptedFocusMinutes } from '@shared/schedule'
import type { PomodoroMode } from '@shared/pomodoro'
import { useFocusTarget } from './useFocusTarget'
import { usePomodoro } from './usePomodoro'

/** Reloj + aviso sonoro + mensaje de fin de bloque + título de la pestaña + bloque enfocado. */
export function usePomodoroSession() {
  const [chime] = useState(() => new ChimePlayer())
  const [message, setMessage] = useState<string | null>(null)
  const focus = useFocusTarget()

  const timer = usePomodoro({
    onComplete: (finished: PomodoroMode, next: PomodoroMode) => {
      chime.play()
      const text = completionMessage(finished, next)
      setMessage(text)
      if (finished !== 'work') return
      void focus.recordSession().then((recorded) => recorded && setMessage(`${text} ${recorded}`))
    },
  })
  const clock = formatClock(timer.remainingMs)

  useEffect(() => {
    const original = document.title
    if (timer.running) document.title = pomodoroTabTitle(clock, timer.mode)
    return () => {
      document.title = original
    }
  }, [clock, timer.running, timer.mode])

  useEffect(() => () => chime.dispose(), [chime])

  /** Un bloque de trabajo interrumpido (reinicio o cambio de modo) también suma sus minutos. */
  function recordInterrupted() {
    if (timer.mode !== 'work') return
    const minutes = interruptedFocusMinutes(timer.durationMs - timer.remainingMs)
    void focus.recordSession(minutes).then((recorded) => recorded && setMessage(recorded))
  }

  return {
    timer,
    clock,
    message,
    focus,
    start: () => {
      chime.unlock()
      setMessage(null)
      timer.start()
    },
    selectMode: (mode: PomodoroMode) => {
      setMessage(null)
      recordInterrupted()
      timer.selectMode(mode)
    },
    reset: () => {
      setMessage(null)
      recordInterrupted()
      timer.reset()
    },
  }
}
