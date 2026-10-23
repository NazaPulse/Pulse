import type { TransactionType } from '@shared/types'
import { TYPE_OPTIONS } from '@shared/utils/transactionForm'

/** Estilo del segmento activo: neón verde para ingresos, rosa para egresos. */
const ACTIVE_STYLES: Record<TransactionType, string> = {
  income: 'bg-ok text-ink shadow-[0_0_14px_-2px_rgb(52_211_153/0.7)]',
  expense: 'bg-danger-soft text-ink shadow-[0_0_14px_-2px_rgb(251_113_133/0.7)]',
}

interface TransactionTypeToggleProps {
  value: TransactionType
  disabled: boolean
  onChange: (value: TransactionType) => void
}

export function TransactionTypeToggle({ value, disabled, onChange }: TransactionTypeToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fg-soft">Tipo</span>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/5 p-1" role="radiogroup">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={[
              'rounded-md px-3 py-2 text-sm font-semibold transition',
              value === option.value ? ACTIVE_STYLES[option.value] : 'text-fg-soft hover:text-fg',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
