import { MAX_RECORDING_MS } from '@shared/audioRecorder'
import { formatClock } from '@shared/format'

type RecordingBarProps = {
  elapsedMs: number
  level: number
  onCancel: () => void
  onStop: () => void
}

/** Franja roja mientras se graba: tiempo, nivel de entrada y botones Descartar/Detener. */
export function RecordingBar({ elapsedMs, level, onCancel, onStop }: RecordingBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-danger/10 px-3.5 py-2.5" role="status" aria-live="polite">
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-soft opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-danger" />
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums text-danger-soft">{formatClock(elapsedMs)}</span>
      <span className="hidden text-xs text-danger-soft/80 sm:inline">/ {formatClock(MAX_RECORDING_MS)} máx.</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-danger/20" aria-hidden="true">
        <div
          className="h-full rounded-full bg-danger-soft transition-[width] duration-75"
          style={{ width: `${Math.round(level * 100)}%` }}
        />
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger-soft transition hover:bg-danger/20"
      >
        Descartar
      </button>
      <button
        type="button"
        onClick={onStop}
        className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-danger-strong"
      >
        <span className="h-2.5 w-2.5 rounded-sm bg-white" aria-hidden="true" />
        Detener
      </button>
    </div>
  )
}
