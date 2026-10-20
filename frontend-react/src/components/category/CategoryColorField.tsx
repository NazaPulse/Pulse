import { isValidHexColor } from '@shared/validation'
import { DEFAULT_COLOR } from '@shared/utils/categoryForm'

interface CategoryColorFieldProps {
  value: string
  disabled: boolean
  onChange: (value: string) => void
}

export function CategoryColorField({ value, disabled, onChange }: CategoryColorFieldProps) {
  const valid = isValidHexColor(value)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-fg-soft" htmlFor="category-color">
        Color
      </label>
      <div className="flex items-center gap-3">
        <input
          id="category-color"
          type="color"
          value={valid ? value : DEFAULT_COLOR}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-surface p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="#6B7280"
          maxLength={7}
          className={[
            'w-full rounded-lg border bg-canvas/60 px-3.5 py-2.5 text-fg outline-none transition',
            'focus:ring-2 focus:ring-accent/30 focus:border-accent',
            'disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-fg-dim',
            valid ? 'border-line-strong' : 'border-danger-soft',
          ].join(' ')}
        />
      </div>
      {!valid ? <p className="text-xs text-danger-soft">Formato esperado: #RRGGBB</p> : null}
    </div>
  )
}
