import { currencyFormatter } from '@shared/format'
import type { CategorySummary } from '@shared/types'
import { RADIUS, STROKE } from '@shared/utils/donutChart'
import type { DonutSlice } from '@shared/utils/donutChart'

interface DonutRingProps {
  slices: DonutSlice[]
  activeId: string | null
  onActiveChange: (id: string | null) => void
}

/** Resaltado de una porción: la activa se ensancha y brilla; el resto se atenúa si hay una activa. */
function sliceLook(slice: DonutSlice, activeId: string | null) {
  const isActive = activeId === slice.category.category_id
  const dimmed = activeId !== null && !isActive
  return {
    strokeWidth: isActive ? STROKE + 4 : STROKE,
    style: { opacity: dimmed ? 0.3 : 1, filter: isActive ? `drop-shadow(0 0 5px ${slice.color})` : undefined },
  }
}

function DonutSliceCircle({ slice, activeId, onActiveChange }: DonutRingProps & { slice: DonutSlice }) {
  const id = slice.category.category_id
  const look = sliceLook(slice, activeId)
  const toggle = () => onActiveChange(activeId === id ? null : id)
  return (
    <circle
      cx="80"
      cy="80"
      r={RADIUS}
      fill="none"
      stroke={slice.color}
      strokeWidth={look.strokeWidth}
      strokeDasharray={slice.dasharray}
      strokeDashoffset={slice.offset}
      className="cursor-pointer transition-all duration-200"
      style={look.style}
      onMouseEnter={() => onActiveChange(id)}
      onMouseLeave={() => onActiveChange(null)}
      onClick={toggle}
    >
      <title>{`${slice.category.category_name}: ${currencyFormatter.format(slice.category.total_amount)}`}</title>
    </circle>
  )
}

function DonutCenterLabel({ active, totalExpenses }: { active: CategorySummary | null; totalExpenses: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
      <span className="eyebrow max-w-[7.5rem] truncate !tracking-[0.1em] text-fg-muted">
        {active ? active.category_name : 'Total egresos'}
      </span>
      <span className="mt-1 font-display text-lg font-bold tabular-nums text-fg">
        {currencyFormatter.format(active ? active.total_amount : totalExpenses)}
      </span>
      {active ? <span className="text-xs text-accent">{active.percentage}%</span> : null}
    </div>
  )
}

export function DonutRing({
  active,
  totalExpenses,
  ...ringProps
}: DonutRingProps & { active: CategorySummary | null; totalExpenses: number }) {
  return (
    <div className="relative h-52 w-52 shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label="Egresos por sobre">
        <circle
          cx="80"
          cy="80"
          r={RADIUS + 14}
          fill="none"
          stroke="#7B8AA0"
          strokeOpacity=".35"
          strokeWidth="1"
          strokeDasharray="1 5"
        />
        <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#1E293B" strokeWidth={STROKE} />
        {ringProps.slices.map((slice) => (
          <DonutSliceCircle key={slice.category.category_id} slice={slice} {...ringProps} />
        ))}
      </svg>
      <DonutCenterLabel active={active} totalExpenses={totalExpenses} />
    </div>
  )
}
