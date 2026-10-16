import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'

export type PomodoroMode = 'work' | 'short_break' | 'long_break'

export const MODE_DURATIONS_MS: Record<PomodoroMode, number> = {
  work: 25 * 60 * 1000,
  short_break: 5 * 60 * 1000,
  long_break: 15 * 60 * 1000,
}

/** Cada cuántos bloques de trabajo corresponde un descanso largo. */
export const WORK_SESSIONS_PER_LONG_BREAK = 4

// Misma clave que /frontend-react: el reloj sobrevive a recargas de la página.
const STORAGE_KEY = 'pulse.pomodoro'
const TICK_MS = 250

/**
 * Estado mínimo del reloj. No se guarda el "tiempo restante": se deriva de
 * marcas de tiempo reales (`Date.now() - startedAt`), así el temporizador no se
 * desfasa cuando el navegador ralentiza los `setInterval` de una pestaña oculta.
 */
interface TimerState {
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
    if (!raw) return { ...INITIAL_STATE }
    const parsed = JSON.parse(raw) as Partial<TimerState>
    if (!parsed.mode || !(parsed.mode in MODE_DURATIONS_MS)) return { ...INITIAL_STATE }
    return {
      mode: parsed.mode,
      accumulatedMs: Number(parsed.accumulatedMs) || 0,
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : null,
      completedWorkSessions: Number(parsed.completedWorkSessions) || 0,
    }
  } catch {
    return { ...INITIAL_STATE }
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

export interface UsePomodoroOptions {
  /** Se invoca una vez al terminar cada bloque (también si la pestaña estaba oculta). */
  onComplete?: (finished: PomodoroMode, next: PomodoroMode) => void
}

export interface UsePomodoro {
  mode: ComputedRef<PomodoroMode>
  running: ComputedRef<boolean>
  durationMs: ComputedRef<number>
  remainingMs: ComputedRef<number>
  progress: ComputedRef<number>
  completedWorkSessions: ComputedRef<number>
  start: () => void
  pause: () => void
  reset: () => void
  selectMode: (mode: PomodoroMode) => void
}

export function usePomodoro({ onComplete }: UsePomodoroOptions = {}): UsePomodoro {
  const state = ref<TimerState>(readStoredState())
  const now = ref(Date.now())

  const running = computed(() => state.value.startedAt !== null)
  const durationMs = computed(() => MODE_DURATIONS_MS[state.value.mode])
  const remainingMs = computed(() =>
    Math.max(0, durationMs.value - elapsedMs(state.value, now.value)),
  )

  watch(
    state,
    (value) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      } catch {
        /* almacenamiento no disponible: el reloj funciona igual en memoria */
      }
    },
    { deep: true },
  )

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
    (isRunning) => {
      stopTicking()
      if (!isRunning) return
      interval = window.setInterval(sync, TICK_MS)
      document.addEventListener('visibilitychange', sync)
    },
    { immediate: true },
  )

  onBeforeUnmount(stopTicking)

  // Fin del bloque: pasa al siguiente modo, en pausa y con el reloj completo.
  watch(
    remainingMs,
    (remaining) => {
      if (!running.value || remaining > 0) return
      const finished = state.value.mode
      const next = nextMode(state.value)
      state.value = { ...next, accumulatedMs: 0, startedAt: null }
      onComplete?.(finished, next.mode)
    },
    { immediate: true },
  )

  function start() {
    const at = Date.now()
    now.value = at
    if (state.value.startedAt === null) state.value = { ...state.value, startedAt: at }
  }

  function pause() {
    const at = Date.now()
    now.value = at
    if (state.value.startedAt === null) return
    state.value = { ...state.value, accumulatedMs: elapsedMs(state.value, at), startedAt: null }
  }

  function reset() {
    now.value = Date.now()
    state.value = { ...state.value, accumulatedMs: 0, startedAt: null }
  }

  function selectMode(mode: PomodoroMode) {
    now.value = Date.now()
    state.value = { ...state.value, mode, accumulatedMs: 0, startedAt: null }
  }

  return {
    mode: computed(() => state.value.mode),
    running,
    durationMs,
    remainingMs,
    progress: computed(() => 1 - remainingMs.value / durationMs.value),
    completedWorkSessions: computed(() => state.value.completedWorkSessions),
    start,
    pause,
    reset,
    selectMode,
  }
}
