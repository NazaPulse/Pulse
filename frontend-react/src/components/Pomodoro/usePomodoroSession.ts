import { useEffect, useState } from 'react'

import { formatClock } from '@shared/format'
import { ChimePlayer, completionMessage, pomodoroTabTitle } from '@shared/pomodoro'
import type { PomodoroMode } from '@shared/pomodoro'
import { usePomodoro } from './usePomodoro'

/** Reloj + aviso sonoro + mensaje de fin de bloque + título de la pestaña. */
export function usePomodoroSession() {
  const [chime] = useState(() => new ChimePlayer())
  const [message, setMessage] = useState<string | null>(null)

  const timer = usePomodoro({
    onComplete: (finished: PomodoroMode, next: PomodoroMode) => {
      chime.play()
      setMessage(completionMessage(finished, next))
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

  return {
    timer,
    clock,
    message,
    start: () => {
      chime.unlock()
      setMessage(null)
      timer.start()
    },
    selectMode: (mode: PomodoroMode) => {
      setMessage(null)
      timer.selectMode(mode)
    },
    reset: () => {
      setMessage(null)
      timer.reset()
    },
  }
}
