import { useCallback, useEffect, useRef, useState } from 'react'

import * as pomodoro from '@shared/pomodoro'
import type { PomodoroMode, TimerState } from '@shared/pomodoro'
import type { RefObject } from 'react'

type UsePomodoroOptions = {
  /** Se invoca una vez al terminar cada bloque (también si la pestaña estaba oculta). */
  onComplete?: (finished: PomodoroMode, next: PomodoroMode) => void
}

type Transition = (state: TimerState, at: number) => TimerState

/** `value` vigente para callbacks que se ejecutan fuera del render. */
function useLatestRef<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

// El intervalo solo dispara re-renders; su frecuencia real no afecta al cálculo.
function useTicker(running: boolean, setNow: (now: number) => void) {
  useEffect(() => {
    if (!running) return
    const sync = () => setNow(Date.now())
    const id = window.setInterval(sync, pomodoro.TICK_MS)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [running, setNow])
}

type Completion = {
  running: boolean
  remainingMs: number
  state: TimerState
  setState: (state: TimerState) => void
  onCompleteRef: RefObject<UsePomodoroOptions['onComplete']>
}

/** Al llegar a 0 se cierra el bloque (una sola vez) y se pasa al siguiente modo. */
function useBlockCompletion(timer: Completion) {
  const { running, remainingMs, state, setState, onCompleteRef } = timer
  useEffect(() => {
    if (!running || remainingMs > 0) return
    const done = pomodoro.completeBlock(state)
    onCompleteRef.current?.(done.finished, done.next)
    setState(done.state)
  }, [running, remainingMs, state, setState, onCompleteRef])
}

function timerApi(state: TimerState, now: number, apply: (transition: Transition) => void) {
  const running = pomodoro.isRunning(state)
  return {
    mode: state.mode,
    running,
    durationMs: pomodoro.durationOf(state),
    remainingMs: pomodoro.remainingMs(state, now),
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

export function usePomodoro({ onComplete }: UsePomodoroOptions = {}) {
  const [state, setState] = useState<TimerState>(pomodoro.loadTimerState)
  const [now, setNow] = useState(() => Date.now())
  const onCompleteRef = useLatestRef(onComplete)
  const running = pomodoro.isRunning(state)
  const remainingMs = pomodoro.remainingMs(state, now)

  useEffect(() => pomodoro.saveTimerState(state), [state])
  useTicker(running, setNow)
  useBlockCompletion({ running, remainingMs, state, setState, onCompleteRef })

  const apply = useCallback((transition: Transition) => {
    const at = Date.now()
    setNow(at)
    setState((prev) => transition(prev, at))
  }, [])

  return timerApi(state, now, apply)
}

export type PomodoroTimer = ReturnType<typeof usePomodoro>
