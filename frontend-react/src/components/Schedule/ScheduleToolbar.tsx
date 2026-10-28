import { WORK_HOUR_OPTIONS, formatMinute } from '@shared/schedule'
import type { SchedulePrefs, WorkHours } from '@shared/schedule'
import { Icon } from '../Icon'

type Option<T extends string> = { value: T; label: string }

/** Selector segmentado (Día/Semana, 24 h/Laboral). */
function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Option<T>[]; onChange: (value: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-lg border border-line-strong bg-white/[0.03] p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${value === option.value ? 'bg-accent text-ink shadow-glow-sm' : 'text-fg-muted hover:text-fg'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function HourSelect({ label, value, onChange }: { label: string; value: number; onChange: (minute: number) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-fg-muted">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-md border border-line-strong bg-canvas/60 px-1.5 py-1 font-mono text-xs text-fg outline-none focus:border-accent"
      >
        {WORK_HOUR_OPTIONS.map((minute) => (
          <option key={minute} value={minute}>
            {formatMinute(minute)}
          </option>
        ))}
      </select>
    </label>
  )
}

const ACTION_BUTTON =
  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'

type ScheduleToolbarProps = {
  prefs: SchedulePrefs
  busy: boolean
  onPrefs: (patch: Partial<SchedulePrefs>) => void
  onWorkHours: (edge: keyof WorkHours, minute: number) => void
  onAutoSchedule: () => void
  onCopyPreviousDay: () => void
}

/** Vista (día/semana), zoom, horario laboral y acciones de planificación inteligente. */
export function ScheduleToolbar({ prefs, busy, onPrefs, onWorkHours, onAutoSchedule, onCopyPreviousDay }: ScheduleToolbarProps) {
  const isDay = prefs.mode === 'day'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented
        label="Vista"
        value={prefs.mode}
        options={[{ value: 'day', label: 'Día' }, { value: 'week', label: 'Semana' }]}
        onChange={(mode) => onPrefs({ mode })}
      />
      {isDay ? (
        <Segmented
          label="Zoom"
          value={prefs.zoom}
          options={[{ value: 'day', label: '24 h' }, { value: 'work', label: 'Laboral' }]}
          onChange={(zoom) => onPrefs({ zoom })}
        />
      ) : null}

      <div className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1" title="Horario laboral: zoom y agendado automático">
        <HourSelect label="Laboral" value={prefs.workHours.start} onChange={(minute) => onWorkHours('start', minute)} />
        <HourSelect label="a" value={prefs.workHours.end} onChange={(minute) => onWorkHours('end', minute)} />
      </div>

      {isDay ? (
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={onCopyPreviousDay}
            disabled={busy}
            className={`${ACTION_BUTTON} border-line-strong bg-white/[0.03] text-fg-soft hover:border-accent/50 hover:text-accent`}
          >
            Copiar día anterior
          </button>
          <button
            type="button"
            onClick={onAutoSchedule}
            disabled={busy}
            className={`${ACTION_BUTTON} border-accent bg-accent text-ink shadow-glow hover:bg-accent-hover`}
          >
            <Icon name="bolt" className="h-3.5 w-3.5" strokeWidth={2} />
            Agendar automáticamente
          </button>
        </div>
      ) : null}
    </div>
  )
}
