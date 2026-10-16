import { useCallback, useEffect, useRef, useState } from 'react'

export type PomodoroMode = 'work' | 'short_break' | 'long_break'

export const MODE_DURATIONS_MS: Record<PomodoroMode, number> = {
  work: 25 * 60 * 1000,
  short_break: 5 * 60 * 1000,
  long_break: 15 * 60 * 1000,
}

/** Cada cuántos bloques de trabajo corresponde un descanso largo. */
export const WORK_SESSIONS_PER_LONG_BREAK = 4

const STORAGE_KEY = 'pulse.pomodoro'
const TICK_MS = 250

/**
 * Estado mínimo del reloj. No se guarda el "tiempo restante": se deriva de
 * marcas de tiempo reales, así el temporizador no se desfasa cuando el
 * navegador ralentiza los `setInterval` de una pestaña en segundo plano.
 */
type TimerState = {
  mode: PomodoroMode
  /** Tiempo ya transcurrido en tramos anteriores (antes de la última pausa). */
  accumulatedMs: number
  /** `Date.now()` del último Iniciar/Reanudar; `null` si está pausado. */
  startedAt: number | null
  completedWorkSessions: number
}

const INITIAL_STATE: TimerState = {
  mode: 'work',
  accumulatedMs: 0,
  startedAt: null,
  completedWorkSessions: 0,
}

function readStoredState(): TimerState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_STATE
    const parsed = JSON.parse(raw) as Partial<TimerState>
    if (!parsed.mode || !(parsed.mode in MODE_DURATIONS_MS)) return INITIAL_STATE
    return {
      mode: parsed.mode,
      accumulatedMs: Number(parsed.accumulatedMs) || 0,
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : null,
      completedWorkSessions: Number(parsed.completedWorkSessions) || 0,
    }
  } catch {
    return INITIAL_STATE
  }
}

function elapsedMs(state: TimerState, now: number): number {
  return state.accumulatedMs + (state.startedAt !== null ? now - state.startedAt : 0)
}

function nextMode(state: TimerState): { mode: PomodoroMode; completedWorkSessions: number } {
  if (state.mode !== 'work') {
    return { mode: 'work', completedWorkSessions: state.completedWorkSessions }
  }
  const completed = state.completedWorkSessions + 1
  return {
    mode: completed % WORK_SESSIONS_PER_LONG_BREAK === 0 ? 'long_break' : 'short_break',
    completedWorkSessions: completed,
  }
}

type UsePomodoroOptions = {
  /** Se invoca una vez al terminar cada bloque (también si la pestaña estaba oculta). */
  onComplete?: (finished: PomodoroMode, next: PomodoroMode) => void
}

export function usePomodoro({ onComplete }: UsePomodoroOptions = {}) {
  const [state, setState] = useState<TimerState>(readStoredState)
  const [now, setNow] = useState(() => Date.now())
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const running = state.startedAt !== null
  const durationMs = MODE_DURATIONS_MS[state.mode]
  const remainingMs = Math.max(0, durationMs - elapsedMs(state, now))

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* almacenamiento no disponible: el reloj funciona igual en memoria */
    }
  }, [state])

  // El intervalo solo dispara re-renders; su frecuencia real no afecta al cálculo.
  useEffect(() => {
    if (!running) return
    const sync = () => setNow(Date.now())
    const id = window.setInterval(sync, TICK_MS)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [running])

  // Fin del bloque: pasa al siguiente modo, en pausa y con el reloj completo.
  useEffect(() => {
    if (!running || remainingMs > 0) return
    const next = nextMode(state)
    onCompleteRef.current?.(state.mode, next.mode)
    setState({ ...next, accumulatedMs: 0, startedAt: null })
  }, [running, remainingMs, state])

  const start = useCallback(() => {
    const at = Date.now()
    setNow(at)
    setState((prev) => (prev.startedAt !== null ? prev : { ...prev, startedAt: at }))
  }, [])

  const pause = useCallback(() => {
    const at = Date.now()
    setNow(at)
    setState((prev) =>
      prev.startedAt === null
        ? prev
        : { ...prev, accumulatedMs: elapsedMs(prev, at), startedAt: null },
    )
  }, [])

  const reset = useCallback(() => {
    setNow(Date.now())
    setState((prev) => ({ ...prev, accumulatedMs: 0, startedAt: null }))
  }, [])

  const selectMode = useCallback((mode: PomodoroMode) => {
    setNow(Date.now())
    setState((prev) => ({ ...prev, mode, accumulatedMs: 0, startedAt: null }))
  }, [])

  return {
    mode: state.mode,
    running,
    durationMs,
    remainingMs,
    progress: 1 - remainingMs / durationMs,
    completedWorkSessions: state.completedWorkSessions,
    start,
    pause,
    reset,
    selectMode,
  }
}
