import { useEffect, useState } from 'react'

import { formatClock } from '@shared/format'
import { ChimePlayer, completionMessage, pomodoroTabTitle } from '@shared/pomodoro'
import { interruptedFocusMinutes } from '@shared/schedule'
import type { PomodoroMode } from '@shared/pomodoro'
import { useFocusTarget } from './useFocusTarget'
import { usePomodoro } from './usePomodoro'

type FocusTarget = ReturnType<typeof useFocusTarget>
type Timer = ReturnType<typeof usePomodoro>
type SetMessage = (message: string | null) => void

/** Fin de bloque: suena el aviso, se muestra el mensaje y un bloque de trabajo suma minutos al foco. */
function completionHandler(chime: ChimePlayer, setMessage: SetMessage, focus: FocusTarget) {
  return (finished: PomodoroMode, next: PomodoroMode) => {
    chime.play()
    const text = completionMessage(finished, next)
    setMessage(text)
    if (finished !== 'work') return
    void focus.recordSession().then((recorded) => recorded && setMessage(`${text} ${recorded}`))
  }
}

/** Mientras corre, la pestaña muestra el tiempo restante; al terminar se restaura el título. */
function useTabTitle(clock: string, timer: Timer) {
  const { running, mode } = timer
  useEffect(() => {
    const original = document.title
    if (running) document.title = pomodoroTabTitle(clock, mode)
    return () => {
      document.title = original
    }
  }, [clock, running, mode])
}

/** Un bloque de trabajo interrumpido (reinicio o cambio de modo) también suma sus minutos. */
function recordInterrupted(timer: Timer, focus: FocusTarget, setMessage: SetMessage) {
  if (timer.mode !== 'work') return
  const minutes = interruptedFocusMinutes(timer.durationMs - timer.remainingMs)
  void focus.recordSession(minutes).then((recorded) => recorded && setMessage(recorded))
}

type Session = { timer: Timer; focus: FocusTarget; chime: ChimePlayer; setMessage: SetMessage }

function sessionControls({ timer, focus, chime, setMessage }: Session) {
  return {
    start: () => {
      chime.unlock()
      setMessage(null)
      timer.start()
    },
    selectMode: (mode: PomodoroMode) => {
      setMessage(null)
      recordInterrupted(timer, focus, setMessage)
      timer.selectMode(mode)
    },
    reset: () => {
      setMessage(null)
      recordInterrupted(timer, focus, setMessage)
      timer.reset()
    },
  }
}

/** Reloj + aviso sonoro + mensaje de fin de bloque + título de la pestaña + bloque enfocado. */
export function usePomodoroSession() {
  const [chime] = useState(() => new ChimePlayer())
  const [message, setMessage] = useState<string | null>(null)
  const focus = useFocusTarget()
  const timer = usePomodoro({ onComplete: completionHandler(chime, setMessage, focus) })
  const clock = formatClock(timer.remainingMs)

  useTabTitle(clock, timer)
  useEffect(() => () => chime.dispose(), [chime])

  return { timer, clock, message, focus, ...sessionControls({ timer, focus, chime, setMessage }) }
}
