import { PRIORITY_LABELS, PRIORITY_OPTIONS } from '@shared/tasks'
import type { TaskPriority } from '../../types/productivity'

type PriorityPickerProps = {
  value: TaskPriority
  disabled: boolean
  onChange: (priority: TaskPriority) => void
}

export function PriorityPicker({ value, disabled, onChange }: PriorityPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fg-soft">Prioridad</span>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1" role="radiogroup">
        {PRIORITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${value === option.value ? option.active : 'text-fg-soft hover:text-fg'}`}
          >
            {PRIORITY_LABELS[option.value]}
          </button>
        ))}
      </div>
    </div>
  )
}
