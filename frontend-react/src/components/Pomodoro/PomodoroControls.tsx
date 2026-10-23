import { MODE_STYLES, MODE_LABELS, MODE_DURATIONS_MS, POMODORO_MODES } from '@shared/pomodoro'
import type { PomodoroMode } from '@shared/pomodoro'

type ModeTabsProps = { mode: PomodoroMode; onSelect: (mode: PomodoroMode) => void }

export function PomodoroModeTabs({ mode, onSelect }: ModeTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1" role="tablist">
      {POMODORO_MODES.map((value) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={mode === value}
          onClick={() => onSelect(value)}
          className={[
            'rounded-md px-2 py-2 text-xs font-semibold transition sm:text-sm',
            mode === value ? MODE_STYLES[value].tab : 'text-fg-soft hover:text-fg',
          ].join(' ')}
        >
          {MODE_LABELS[value]}
          <span className="block text-[11px] font-normal opacity-80">
            {MODE_DURATIONS_MS[value] / 60_000} min
          </span>
        </button>
      ))}
    </div>
  )
}

type ControlsProps = {
  mode: PomodoroMode
  running: boolean
  pristine: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

export function PomodoroControls({ mode, running, pristine, onStart, onPause, onReset }: ControlsProps) {
  return (
    <div className="flex justify-center gap-3">
      {running ? (
        <button
          type="button"
          onClick={onPause}
          className="min-w-32 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-white/15"
        >
          Pausar
        </button>
      ) : (
        <button
          type="button"
          onClick={onStart}
          className={`min-w-32 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${MODE_STYLES[mode].button}`}
        >
          {pristine ? 'Iniciar' : 'Reanudar'}
        </button>
      )}
      <button
        type="button"
        onClick={onReset}
        disabled={pristine}
        className="rounded-lg border border-line-strong bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-fg-soft transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reiniciar
      </button>
    </div>
  )
}
