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
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition',
              activeId === category.category_id ? 'bg-white/[0.07]' : 'hover:bg-white/5',
            ].join(' ')}
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-fg-soft">{category.category_name}</span>
                <span className="font-mono text-xs tabular-nums text-fg-muted">{category.percentage}%</span>
              </span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, Number(category.percentage)))}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}99`,
                  }}
                />
              </span>
            </span>
            <span className="w-28 text-right font-display font-semibold tabular-nums text-fg">
              {currencyFormatter.format(category.total_amount)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
