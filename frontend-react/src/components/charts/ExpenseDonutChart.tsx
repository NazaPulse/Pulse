import { useState } from 'react'

import type { CategorySummary, FinanceSummary } from '@shared/types'
import { buildDonutSlices, findActive, isEmptyBreakdown } from '@shared/utils/donutChart'
import { chartColor } from '@shared/chartPalette'
import { DonutLegend } from './DonutLegend'
import { DonutRing } from './DonutRing'

// Paleta pastel de Pulse para los sobres sin color propio.
const pulseSlices = (categories: CategorySummary[]) =>
  buildDonutSlices(categories).map((slice, index) => ({ ...slice, color: chartColor(slice.color, index) }))

export function ExpenseDonutChart({ summary }: { summary: FinanceSummary }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const categories = summary.by_category

  if (isEmptyBreakdown(categories)) {
    return (
      <div className="pulse-empty px-4 py-10 text-center text-sm text-fg-muted">
        Todavía no hay egresos registrados para mostrar el desglose por sobre.
      </div>
    )
  }

  const slices = pulseSlices(categories)
  return (
    <div className="pulse-card flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-center">
      <DonutRing
        slices={slices}
        activeId={activeId}
        onActiveChange={setActiveId}
        active={findActive(categories, activeId)}
        totalExpenses={summary.total_expenses}
      />
      <DonutLegend slices={slices} activeId={activeId} onActiveChange={setActiveId} />
    </div>
  )
}
