import type { Category } from '@shared/types'
import { Select } from '../Select'

interface TransactionCategorySelectProps {
  categories: Category[]
  value: string
  disabled: boolean
  isExpense: boolean
  onChange: (value: string) => void
}

export function TransactionCategorySelect(props: TransactionCategorySelectProps) {
  const { categories, value, disabled, isExpense, onChange } = props
  return (
    <>
      <Select
        label={isExpense ? 'Sobre' : 'Sobre (opcional)'}
        name="category_id"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={isExpense}
      >
        <option value="">{isExpense ? 'Seleccioná un sobre' : 'Sin sobre'}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      {isExpense && categories.length === 0 ? (
        <p className="-mt-2 text-xs text-amber-600">
          Los egresos requieren un sobre. Creá uno desde la sección Sobres de presupuesto.
        </p>
      ) : null}
    </>
  )
}
