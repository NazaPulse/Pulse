// Lógica del temporizador Pomodoro, independiente del framework: estado, transiciones,
// persistencia y aviso sonoro. Los hooks/composables de cada frontend solo la conectan a su
// sistema de reactividad.

export type PomodoroMode = 'work' | 'short_break' | 'long_break'

export const MODE_DURATIONS_MS: Record<PomodoroMode, number> = {
  work: 25 * 60 * 1000,
  short_break: 5 * 60 * 1000,
  long_break: 15 * 60 * 1000,
}

export const MODE_LABELS: Record<PomodoroMode, string> = {
  work: 'Trabajo',
  short_break: 'Descanso corto',
  long_break: 'Descanso largo',
}

/** Cada cuántos bloques de trabajo corresponde un descanso largo. */
export const WORK_SESSIONS_PER_LONG_BREAK = 4

/** Colores de cada modo: trazo del anillo, botón principal y pestaña activa. */
export const MODE_STYLES: Record<PomodoroMode, { ring: string; button: string; tab: string }> = {
  work: {
    ring: 'text-danger-soft',
    button: 'bg-danger hover:bg-danger-strong',
    tab: 'bg-danger text-white shadow-sm',
  },
  short_break: {
    ring: 'text-ok',
    button: 'bg-ok-strong hover:bg-ok-deep',
    tab: 'bg-ok-strong text-white shadow-sm',
  },
  long_break: {
    ring: 'text-info',
    button: 'bg-info-strong hover:bg-info-deep',
    tab: 'bg-info-strong text-white shadow-sm',
  },
}

export const POMODORO_MODES = Object.keys(MODE_DURATIONS_MS) as PomodoroMode[]

export const STORAGE_KEY = 'pulse.pomodoro'
export const TICK_MS = 250

/**
 * Estado mínimo del reloj. No se guarda el "tiempo restante": se deriva de marcas de
 * tiempo reales, así el temporizador no se desfasa cuando el navegador ralentiza los
 * `setInterval` de una pestaña en segundo plano.
 */
export interface TimerState {
  mode: PomodoroMode
  /** Tiempo ya transcurrido en tramos anteriores (antes de la última pausa). */
  accumulatedMs: number
  /** `Date.now()` del último Iniciar/Reanudar; `null` si está pausado. */
  startedAt: number | null
  completedWorkSessions: number
}

export const INITIAL_TIMER_STATE: TimerState = {
  mode: 'work',
  accumulatedMs: 0,
  startedAt: null,
  completedWorkSessions: 0,
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

/** Lee el estado guardado; cualquier dato inválido o storage no disponible vuelve al inicial. */
export function loadTimerState(storage: Pick<Storage, 'getItem'> = window.localStorage): TimerState {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<TimerState>) : null
    if (!parsed?.mode || !(parsed.mode in MODE_DURATIONS_MS)) return { ...INITIAL_TIMER_STATE }
    return {
      mode: parsed.mode,
      accumulatedMs: Number(parsed.accumulatedMs) || 0,
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : null,
      completedWorkSessions: Number(parsed.completedWorkSessions) || 0,
    }
  } catch {
    return { ...INITIAL_TIMER_STATE }
  }
}

/** Persiste el estado para que el reloj sobreviva a recargas; sin storage sigue en memoria. */
export function saveTimerState(state: TimerState, storage: StorageLike = window.localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* almacenamiento no disponible */
  }
}

export function elapsedMs(state: TimerState, now: number): number {
  return state.accumulatedMs + (state.startedAt !== null ? now - state.startedAt : 0)
}

export function durationOf(state: TimerState): number {
  return MODE_DURATIONS_MS[state.mode]
}

export function remainingMs(state: TimerState, now: number): number {
  return Math.max(0, durationOf(state) - elapsedMs(state, now))
}

export function progressOf(state: TimerState, now: number): number {
  return 1 - remainingMs(state, now) / durationOf(state)
}

export function isRunning(state: TimerState): boolean {
  return state.startedAt !== null
}

export function startTimer(state: TimerState, at: number): TimerState {
  return isRunning(state) ? state : { ...state, startedAt: at }
}

export function pauseTimer(state: TimerState, at: number): TimerState {
  return isRunning(state) ? { ...state, accumulatedMs: elapsedMs(state, at), startedAt: null } : state
}

export function resetTimer(state: TimerState): TimerState {
  return { ...state, accumulatedMs: 0, startedAt: null }
}

export function selectTimerMode(state: TimerState, mode: PomodoroMode): TimerState {
  return { ...resetTimer(state), mode }
}

export interface BlockCompletion {
  state: TimerState
  finished: PomodoroMode
  next: PomodoroMode
}

/** Fin del bloque: pasa al siguiente modo, en pausa y con el reloj completo. */
export function completeBlock(state: TimerState): BlockCompletion {
  const finished = state.mode
  const completed = state.completedWorkSessions + (finished === 'work' ? 1 : 0)
  let next: PomodoroMode = 'work'
  if (finished === 'work') {
    next = completed % WORK_SESSIONS_PER_LONG_BREAK === 0 ? 'long_break' : 'short_break'
  }
  return { state: { mode: next, accumulatedMs: 0, startedAt: null, completedWorkSessions: completed }, finished, next }
}

export function completionMessage(finished: PomodoroMode, next: PomodoroMode): string {
  return finished === 'work'
    ? `¡Bloque de trabajo terminado! Siguiente: ${MODE_LABELS[next].toLowerCase()}.`
    : '¡Descanso terminado! A concentrarse.'
}

/** Leyenda bajo el reloj según el estado actual. */
export function statusLabel(state: TimerState): string {
  if (isRunning(state)) return MODE_LABELS[state.mode]
  return state.accumulatedMs === 0 ? 'Listo para empezar' : 'En pausa'
}

export function completedSessionsLabel(count: number): string {
  return count === 1 ? '1 bloque de trabajo completado' : `${count} bloques de trabajo completados`
}

/** Tres tonos cortos generados con la Web Audio API (sin archivos de audio). */
function playChime(context: AudioContext | null): void {
  if (!context) return
  void context.resume().catch(() => undefined)
  const start = context.currentTime
  ;[0, 0.25, 0.5].forEach((offset, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = index === 2 ? 1046.5 : 880
    gain.gain.setValueAtTime(0.0001, start + offset)
    gain.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.22)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(start + offset)
    oscillator.stop(start + offset + 0.25)
  })
}

/** Título de la pestaña del navegador mientras el reloj corre. */
export function pomodoroTabTitle(clock: string, mode: PomodoroMode): string {
  return `${clock} · ${MODE_LABELS[mode]} — Pulse`
}

/** Aviso sonoro del fin de cada bloque. */
export class ChimePlayer {
  private context: AudioContext | null = null

  /** Se crea con un gesto del usuario para que el navegador permita el aviso aunque la pestaña esté oculta. */
  unlock(): void {
    if (!this.context && typeof AudioContext !== 'undefined') this.context = new AudioContext()
    void this.context?.resume().catch(() => undefined)
  }

  play(): void {
    playChime(this.context)
  }

  dispose(): void {
    void this.context?.close().catch(() => undefined)
    this.context = null
  }
}
