import type { FinanceSummary } from '@shared/types'
import { ExpenseDonutChart } from './charts/ExpenseDonutChart'
import { SummaryCards } from './charts/SummaryCards'

export function FinanceCharts({ summary }: { summary: FinanceSummary }) {
  return (
    <div className="flex flex-col gap-4">
      <SummaryCards summary={summary} />
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Egresos por sobre</h2>
        <ExpenseDonutChart summary={summary} />
      </div>
    </div>
  )
}
