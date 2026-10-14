import { currencyFormatter } from '@shared/format'
import type { DonutSlice } from '@shared/utils/donutChart'

interface DonutLegendProps {
  slices: DonutSlice[]
  activeId: string | null
  onActiveChange: (id: string | null) => void
}

export function DonutLegend({ slices, activeId, onActiveChange }: DonutLegendProps) {
  return (
    <ul className="flex w-full flex-col gap-1">
      {slices.map(({ category, color }) => (
        <li key={category.category_id}>
          <button
            type="button"
            onMouseEnter={() => onActiveChange(category.category_id)}
            onMouseLeave={() => onActiveChange(null)}
            onFocus={() => onActiveChange(category.category_id)}
            onBlur={() => onActiveChange(null)}
            className={[
              'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition',
              activeId === category.category_id ? 'bg-slate-100' : 'hover:bg-slate-50',
            ].join(' ')}
          >
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="min-w-0 flex-1 truncate text-slate-700">{category.category_name}</span>
            <span className="tabular-nums text-slate-500">{category.percentage}%</span>
            <span className="w-28 text-right font-medium tabular-nums text-slate-900">
              {currencyFormatter.format(category.total_amount)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
