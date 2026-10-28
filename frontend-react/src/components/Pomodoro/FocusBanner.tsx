import { durationLabel } from '@shared/schedule'
import type { FocusTarget } from '@shared/schedule'
import { Icon } from '../Icon'

type FocusBannerProps = {
  target: FocusTarget
  onClear: () => void
}

/** Bloque del Cronograma al que se imputan los Pomodoros de trabajo. */
export function FocusBanner({ target, onClear }: FocusBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2.5">
      <Icon name="focus" className="h-5 w-5 shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="eyebrow">Enfocado en</p>
        <p className="truncate text-sm font-semibold text-fg">{target.title}</p>
        <p className="font-mono text-[0.6875rem] text-fg-muted">{durationLabel(target.actualMinutes)} reales registrados</p>
      </div>
      <button
        type="button"
        onClick={onClear}
        aria-label="Dejar de enfocar este bloque"
        className="rounded-lg p-1.5 text-fg-dim transition hover:bg-white/10 hover:text-accent"
      >
        <Icon name="close" className="h-4 w-4" />
      </button>
    </div>
  )
}
