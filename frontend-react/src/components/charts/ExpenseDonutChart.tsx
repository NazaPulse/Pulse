import { useState } from 'react'

import type { FinanceSummary } from '@shared/types'
import { buildDonutSlices, findActive, isEmptyBreakdown } from '@shared/utils/donutChart'
import { DonutLegend } from './DonutLegend'
import { DonutRing } from './DonutRing'

export function ExpenseDonutChart({ summary }: { summary: FinanceSummary }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const categories = summary.by_category

  if (isEmptyBreakdown(categories)) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
        Todavía no hay egresos registrados para mostrar el desglose por sobre.
      </div>
    )
  }

  const slices = buildDonutSlices(categories)
  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start">
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
