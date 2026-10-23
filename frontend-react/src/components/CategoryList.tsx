import { tintedChipStyle } from '@shared/chartPalette'
import { currencyFormatter } from '@shared/format'
import type { Category } from '@shared/types'
import { RowActions } from './IconButton'

type CategoryListProps = {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <p className="pulse-empty px-4 py-6 text-center text-sm text-fg-muted">
        Todavía no tenés sobres de presupuesto. Creá el primero con el botón de arriba.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {categories.map((category, index) => (
        <li key={category.id} className="flex items-center justify-between gap-3 pulse-card p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold uppercase"
              style={tintedChipStyle(category.color, index)}
            >
              {category.icon.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{category.name}</p>
              <p className="text-xs text-fg-muted">{category.icon}</p>
              <p className="mt-0.5 text-base font-semibold text-fg">
                {currencyFormatter.format(category.target_amount)}
              </p>
            </div>
          </div>
          <RowActions name={category.name} onEdit={() => onEdit(category)} onDelete={() => onDelete(category)} />
        </li>
      ))}
    </ul>
  )
}
