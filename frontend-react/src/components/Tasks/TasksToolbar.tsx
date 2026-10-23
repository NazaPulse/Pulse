import { PRIORITY_FILTERS, TASK_FILTERS, TASK_SORTS } from '@shared/tasks'
import type { PriorityFilter, SortKey, StatusFilter, TaskView } from '@shared/tasks'

const SELECT_CLASS =
  'rounded-lg border border-line-strong bg-canvas/60 px-3 py-1.5 text-sm text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'

type TasksToolbarProps = {
  view: TaskView
  counts: Record<StatusFilter, number>
  onChange: (patch: Partial<TaskView>) => void
}

type SelectProps<T extends string> = {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

function LabeledSelect<T extends string>({ label, value, options, onChange }: SelectProps<T>) {
  return (
    <label className="flex items-center gap-2 text-sm text-fg-soft">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className={SELECT_CLASS}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Pestañas de estado con contador, filtro de prioridad y selector de orden. */
export function TasksToolbar({ view, counts, onChange }: TasksToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-1 rounded-lg bg-white/10 p-1" role="tablist">
        {TASK_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={view.status === option.value}
            onClick={() => onChange({ status: option.value })}
            className={[
              'rounded-md px-3 py-1.5 text-sm font-medium transition',
              view.status === option.value
                ? 'bg-accent/15 text-accent ring-1 ring-inset ring-accent/30'
                : 'text-fg-soft hover:text-fg',
            ].join(' ')}
          >
            {option.label}
            <span className="ml-1.5 text-xs text-fg-dim">{counts[option.value]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LabeledSelect<PriorityFilter>
          label="Prioridad"
          value={view.priority}
          options={PRIORITY_FILTERS}
          onChange={(priority) => onChange({ priority })}
        />
        <LabeledSelect<SortKey>
          label="Ordenar por"
          value={view.sort}
          options={TASK_SORTS}
          onChange={(sort) => onChange({ sort })}
        />
      </div>
    </div>
  )
}
