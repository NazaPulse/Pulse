import { currencyFormatter } from '@shared/format'
import type { CategorySummary } from '@shared/types'
import { RADIUS, STROKE } from '@shared/utils/donutChart'
import type { DonutSlice } from '@shared/utils/donutChart'

interface DonutRingProps {
  slices: DonutSlice[]
  activeId: string | null
  onActiveChange: (id: string | null) => void
}

function DonutSliceCircle({ slice, activeId, onActiveChange }: DonutRingProps & { slice: DonutSlice }) {
  const id = slice.category.category_id
  const dimmed = activeId !== null && activeId !== id
  return (
    <circle
      cx="80"
      cy="80"
      r={RADIUS}
      fill="none"
      stroke={slice.color}
      strokeWidth={activeId === id ? STROKE + 4 : STROKE}
      strokeDasharray={slice.dasharray}
      strokeDashoffset={slice.offset}
      className="cursor-pointer transition-all duration-200"
      style={{ opacity: dimmed ? 0.35 : 1 }}
      onMouseEnter={() => onActiveChange(id)}
      onMouseLeave={() => onActiveChange(null)}
      onClick={() => onActiveChange(activeId === id ? null : id)}
    >
      <title>{`${slice.category.category_name}: ${currencyFormatter.format(slice.category.total_amount)}`}</title>
    </circle>
  )
}

function DonutCenterLabel({ active, totalExpenses }: { active: CategorySummary | null; totalExpenses: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
      <span className="max-w-[7rem] truncate text-xs text-slate-500">
        {active ? active.category_name : 'Total egresos'}
      </span>
      <span className="text-base font-semibold tabular-nums text-slate-900">
        {currencyFormatter.format(active ? active.total_amount : totalExpenses)}
      </span>
      {active ? <span className="text-xs text-slate-500">{active.percentage}%</span> : null}
    </div>
  )
}

export function DonutRing({
  active,
  totalExpenses,
  ...ringProps
}: DonutRingProps & { active: CategorySummary | null; totalExpenses: number }) {
  return (
    <div className="relative h-48 w-48 shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label="Egresos por sobre">
        <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#F1F5F9" strokeWidth={STROKE} />
        {ringProps.slices.map((slice) => (
          <DonutSliceCircle key={slice.category.category_id} slice={slice} {...ringProps} />
        ))}
      </svg>
      <DonutCenterLabel active={active} totalExpenses={totalExpenses} />
    </div>
  )
}
