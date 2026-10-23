import { useCallback, useEffect, useRef, useState } from 'react'

import { Alert } from '../components/Alert'
import { PageHeader } from '../components/PageHeader'
import { ProgressRing } from '../components/Pomodoro/ProgressRing'
import {
  MODE_DURATIONS_MS,
  usePomodoro,
  WORK_SESSIONS_PER_LONG_BREAK,
} from '../components/Pomodoro/usePomodoro'
import type { PomodoroMode } from '../components/Pomodoro/usePomodoro'
import { formatClock } from '@shared/format'

const MODES: { value: PomodoroMode; label: string; ring: string; button: string; tab: string }[] = [
  {
    value: 'work',
    label: 'Trabajo',
    ring: 'text-danger-soft',
    button: 'bg-danger hover:bg-danger-strong',
    tab: 'bg-danger text-white shadow-sm',
  },
  {
    value: 'short_break',
    label: 'Descanso corto',
    ring: 'text-ok',
    button: 'bg-ok-strong hover:bg-ok-deep',
    tab: 'bg-ok-strong text-white shadow-sm',
  },
  {
    value: 'long_break',
    label: 'Descanso largo',
    ring: 'text-info',
    button: 'bg-info-strong hover:bg-info-deep',
    tab: 'bg-info-strong text-white shadow-sm',
  },
]

const MODE_LABELS: Record<PomodoroMode, string> = {
  work: 'Trabajo',
  short_break: 'Descanso corto',
  long_break: 'Descanso largo',
}

/** Tres tonos cortos generados con la Web Audio API (sin archivos de audio). */
function playChime(context: AudioContext | null) {
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

export function PomodoroPage() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [finishedMessage, setFinishedMessage] = useState<string | null>(null)

  const handleComplete = useCallback((finished: PomodoroMode, next: PomodoroMode) => {
    playChime(audioContextRef.current)
    setFinishedMessage(
      finished === 'work'
        ? `¡Bloque de trabajo terminado! Siguiente: ${MODE_LABELS[next].toLowerCase()}.`
        : '¡Descanso terminado! A concentrarse.',
    )
  }, [])

  const timer = usePomodoro({ onComplete: handleComplete })
  const current = MODES.find((m) => m.value === timer.mode) ?? MODES[0]
  const clock = formatClock(timer.remainingMs)

  // El título de la pestaña muestra la cuenta regresiva mientras corre.
  useEffect(() => {
    const original = document.title
    if (timer.running) document.title = `${clock} · ${MODE_LABELS[timer.mode]} — Pulse`
    return () => {
      document.title = original
    }
  }, [clock, timer.running, timer.mode])

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close().catch(() => undefined)
    }
  }, [])

  function handleStart() {
    // El AudioContext se crea con un gesto del usuario para que el navegador
    // permita reproducir el aviso al terminar (aunque la pestaña esté oculta).
    if (!audioContextRef.current && typeof AudioContext !== 'undefined') {
      audioContextRef.current = new AudioContext()
    }
    void audioContextRef.current?.resume().catch(() => undefined)
    setFinishedMessage(null)
    timer.start()
  }

  const sessionInCycle = timer.completedWorkSessions % WORK_SESSIONS_PER_LONG_BREAK
  const isPristine = !timer.running && timer.remainingMs === timer.durationMs

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <PageHeader
        eyebrow="04 · Foco"
        title="Pomodoro"
        subtitle={`Bloques de 25 minutos de concentración con descansos cortos y, cada ${WORK_SESSIONS_PER_LONG_BREAK} bloques, uno largo.`}
      />

      <div className="mx-auto mt-8 flex max-w-md flex-col gap-6 pulse-card p-5 sm:p-8">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1" role="tablist">
          {MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              role="tab"
              aria-selected={timer.mode === mode.value}
              onClick={() => {
                setFinishedMessage(null)
                timer.selectMode(mode.value)
              }}
              className={[
                'rounded-md px-2 py-2 text-xs font-semibold transition sm:text-sm',
                timer.mode === mode.value ? mode.tab : 'text-fg-soft hover:text-fg',
              ].join(' ')}
            >
              {mode.label}
              <span className="block text-[11px] font-normal opacity-80">
                {MODE_DURATIONS_MS[mode.value] / 60_000} min
              </span>
            </button>
          ))}
        </div>

        {finishedMessage ? <Alert variant="success">{finishedMessage}</Alert> : null}

        <ProgressRing progress={timer.progress} colorClass={current.ring}>
          <span
            className="font-mono text-6xl font-semibold tabular-nums tracking-tight text-fg"
            aria-live="off"
          >
            {clock}
          </span>
          <span className="mt-1 text-sm text-fg-muted">
            {timer.running ? current.label : isPristine ? 'Listo para empezar' : 'En pausa'}
          </span>
        </ProgressRing>

        <div className="flex justify-center gap-3">
          {timer.running ? (
            <button
              type="button"
              onClick={timer.pause}
              className="min-w-32 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-white/15"
            >
              Pausar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className={`min-w-32 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${current.button}`}
            >
              {isPristine ? 'Iniciar' : 'Reanudar'}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setFinishedMessage(null)
              timer.reset()
            }}
            disabled={isPristine}
            className="rounded-lg border border-line-strong bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-fg-soft transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reiniciar
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 border-t border-line pt-4">
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: WORK_SESSIONS_PER_LONG_BREAK }, (_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${i < sessionInCycle ? 'bg-danger-soft' : 'bg-white/10'}`}
              />
            ))}
          </div>
          <p className="text-xs text-fg-muted">
            {timer.completedWorkSessions === 1
              ? '1 bloque de trabajo completado'
              : `${timer.completedWorkSessions} bloques de trabajo completados`}
          </p>
        </div>
      </div>
    </section>
  )
}
