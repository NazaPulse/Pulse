import {
  INITIAL_TIMER_STATE,
  STORAGE_KEY,
  WORK_SESSIONS_PER_LONG_BREAK,
  completeBlock,
  completedSessionsLabel,
  completionMessage,
  loadTimerState,
  pauseTimer,
  progressOf,
  remainingMs,
  resetTimer,
  saveTimerState,
  selectTimerMode,
  startTimer,
  statusLabel,
} from './pomodoro'
import type { TimerState } from './pomodoro'

const MINUTE = 60_000
const memoryStorage = (initial?: string) => {
  const data = new Map<string, string>(initial === undefined ? [] : [[STORAGE_KEY, initial]])
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  }
}

describe('transiciones del reloj', () => {
  it('iniciar fija la marca de tiempo y es idempotente', () => {
    const started = startTimer(INITIAL_TIMER_STATE, 1_000)
    expect(started.startedAt).toBe(1_000)
    expect(startTimer(started, 9_000)).toBe(started)
  })

  it('pausar acumula lo transcurrido y reiniciar lo borra', () => {
    const paused = pauseTimer(startTimer(INITIAL_TIMER_STATE, 1_000), 11_000)
    expect(paused).toMatchObject({ accumulatedMs: 10_000, startedAt: null })
    expect(pauseTimer(paused, 99_000)).toBe(paused)
    expect(resetTimer(paused)).toMatchObject({ accumulatedMs: 0, startedAt: null })
  })

  it('el tiempo restante y el progreso se derivan de marcas reales', () => {
    const running = startTimer(INITIAL_TIMER_STATE, 0)
    expect(remainingMs(running, 5 * MINUTE)).toBe(20 * MINUTE)
    expect(progressOf(running, 5 * MINUTE)).toBeCloseTo(0.2)
    expect(remainingMs(running, 99 * MINUTE)).toBe(0)
  })
})

describe('transiciones del reloj', () => {
  it('cambiar de modo reinicia el reloj pero conserva los bloques completados', () => {
    const state: TimerState = { ...INITIAL_TIMER_STATE, accumulatedMs: 4_000, completedWorkSessions: 2 }
    expect(selectTimerMode(state, 'short_break')).toEqual({
      mode: 'short_break',
      accumulatedMs: 0,
      startedAt: null,
      completedWorkSessions: 2,
    })
  })
})

describe('completeBlock', () => {
  it('después de trabajar viene un descanso corto y, cada N bloques, uno largo', () => {
    let state = INITIAL_TIMER_STATE
    const nexts: string[] = []
    for (let i = 0; i < WORK_SESSIONS_PER_LONG_BREAK; i++) {
      const done = completeBlock({ ...state, mode: 'work' })
      nexts.push(done.next)
      state = done.state
    }
    expect(nexts).toEqual(['short_break', 'short_break', 'short_break', 'long_break'])
    expect(state.completedWorkSessions).toBe(WORK_SESSIONS_PER_LONG_BREAK)
  })

  it('después de un descanso se vuelve a trabajar sin sumar bloques', () => {
    const done = completeBlock({ ...INITIAL_TIMER_STATE, mode: 'long_break', completedWorkSessions: 4 })
    expect(done).toMatchObject({ finished: 'long_break', next: 'work' })
    expect(done.state).toMatchObject({ mode: 'work', completedWorkSessions: 4, startedAt: null })
  })
})

describe('persistencia', () => {
  it('guarda y recupera el estado', () => {
    const storage = memoryStorage()
    const state = startTimer({ ...INITIAL_TIMER_STATE, completedWorkSessions: 3 }, 500)
    saveTimerState(state, storage)
    expect(loadTimerState(storage)).toEqual(state)
  })

  it.each([undefined, 'no es json', '{"mode":"inexistente"}'])('datos inválidos (%s) vuelven al estado inicial', (raw) => {
    expect(loadTimerState(memoryStorage(raw))).toEqual(INITIAL_TIMER_STATE)
  })

  it('un storage que falla no rompe el reloj', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    }
    expect(loadTimerState(broken)).toEqual(INITIAL_TIMER_STATE)
    expect(() => saveTimerState(INITIAL_TIMER_STATE, broken)).not.toThrow()
  })
})

describe('textos', () => {
  it('mensaje al terminar un bloque y leyenda del reloj', () => {
    expect(completionMessage('work', 'long_break')).toContain('descanso largo')
    expect(completionMessage('short_break', 'work')).toBe('¡Descanso terminado! A concentrarse.')
    expect(statusLabel(INITIAL_TIMER_STATE)).toBe('Listo para empezar')
    expect(statusLabel({ ...INITIAL_TIMER_STATE, accumulatedMs: 1 })).toBe('En pausa')
    expect(statusLabel(startTimer(INITIAL_TIMER_STATE, 0))).toBe('Trabajo')
    expect(completedSessionsLabel(1)).toBe('1 bloque de trabajo completado')
    expect(completedSessionsLabel(3)).toBe('3 bloques de trabajo completados')
  })
})
