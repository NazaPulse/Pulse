import type { TransactionType } from '@shared/types'
import { TYPE_OPTIONS } from '@shared/utils/transactionForm'

interface TransactionTypeToggleProps {
  value: TransactionType
  disabled: boolean
  onChange: (value: TransactionType) => void
}

export function TransactionTypeToggle({ value, disabled, onChange }: TransactionTypeToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">Tipo</span>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="radiogroup">
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
              value === option.value ? option.active : 'text-slate-600 hover:text-slate-900',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
