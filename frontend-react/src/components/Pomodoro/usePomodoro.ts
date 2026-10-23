import { useCallback, useEffect, useRef, useState } from 'react'

import * as pomodoro from '@shared/pomodoro'
import type { PomodoroMode, TimerState } from '@shared/pomodoro'

type UsePomodoroOptions = {
  /** Se invoca una vez al terminar cada bloque (también si la pestaña estaba oculta). */
  onComplete?: (finished: PomodoroMode, next: PomodoroMode) => void
}

type Transition = (state: TimerState, at: number) => TimerState

export function usePomodoro({ onComplete }: UsePomodoroOptions = {}) {
  const [state, setState] = useState<TimerState>(pomodoro.loadTimerState)
  const [now, setNow] = useState(() => Date.now())
  const onCompleteRef = useRef(onComplete)
  const running = pomodoro.isRunning(state)
  const remainingMs = pomodoro.remainingMs(state, now)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => pomodoro.saveTimerState(state), [state])

  // El intervalo solo dispara re-renders; su frecuencia real no afecta al cálculo.
  useEffect(() => {
    if (!running) return
    const sync = () => setNow(Date.now())
    const id = window.setInterval(sync, pomodoro.TICK_MS)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [running])

  useEffect(() => {
    if (!running || remainingMs > 0) return
    const done = pomodoro.completeBlock(state)
    onCompleteRef.current?.(done.finished, done.next)
    setState(done.state)
  }, [running, remainingMs, state])

  const apply = useCallback((transition: Transition) => {
    const at = Date.now()
    setNow(at)
    setState((prev) => transition(prev, at))
  }, [])

  return {
    mode: state.mode,
    running,
    durationMs: pomodoro.durationOf(state),
    remainingMs,
    progress: pomodoro.progressOf(state, now),
    completedWorkSessions: state.completedWorkSessions,
    pristine: !running && state.accumulatedMs === 0,
    status: pomodoro.statusLabel(state),
    start: () => apply(pomodoro.startTimer),
    pause: () => apply(pomodoro.pauseTimer),
    reset: () => apply(pomodoro.resetTimer),
    selectMode: (mode: PomodoroMode) => apply((prev) => pomodoro.selectTimerMode(prev, mode)),
  }
}

export type PomodoroTimer = ReturnType<typeof usePomodoro>
