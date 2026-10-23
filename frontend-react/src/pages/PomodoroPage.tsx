import { WORK_SESSIONS_PER_LONG_BREAK, MODE_STYLES, completedSessionsLabel } from '@shared/pomodoro'

import { Alert } from '../components/Alert'
import { PageHeader } from '../components/PageHeader'
import { PomodoroControls, PomodoroModeTabs } from '../components/Pomodoro/PomodoroControls'
import { ProgressRing } from '../components/Pomodoro/ProgressRing'
import { usePomodoroSession } from '../components/Pomodoro/usePomodoroSession'

const SUBTITLE = `Bloques de 25 minutos de concentración con descansos cortos y, cada ${WORK_SESSIONS_PER_LONG_BREAK} bloques, uno largo.`

export function PomodoroPage() {
  const { timer, clock, message, start, selectMode, reset } = usePomodoroSession()
  const sessionInCycle = timer.completedWorkSessions % WORK_SESSIONS_PER_LONG_BREAK

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <PageHeader eyebrow="04 · Foco" title="Pomodoro" subtitle={SUBTITLE} />

      <div className="mx-auto mt-8 flex max-w-md flex-col gap-6 pulse-card p-5 sm:p-8">
        <PomodoroModeTabs mode={timer.mode} onSelect={selectMode} />

        {message ? <Alert variant="success">{message}</Alert> : null}

        <ProgressRing progress={timer.progress} colorClass={MODE_STYLES[timer.mode].ring}>
          <span className="font-mono text-6xl font-semibold tabular-nums tracking-tight text-fg" aria-live="off">
            {clock}
          </span>
          <span className="mt-1 text-sm text-fg-muted">{timer.status}</span>
        </ProgressRing>

        <PomodoroControls
          mode={timer.mode}
          running={timer.running}
          pristine={timer.pristine}
          onStart={start}
          onPause={timer.pause}
          onReset={reset}
        />

        <div className="flex flex-col items-center gap-2 border-t border-line pt-4">
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: WORK_SESSIONS_PER_LONG_BREAK }, (_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${i < sessionInCycle ? 'bg-danger-soft' : 'bg-white/10'}`}
              />
            ))}
          </div>
          <p className="text-xs text-fg-muted">{completedSessionsLabel(timer.completedWorkSessions)}</p>
        </div>
      </div>
    </section>
  )
}
