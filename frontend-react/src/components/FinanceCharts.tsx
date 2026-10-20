import type { FinanceSummary } from '@shared/types'
import { ExpenseDonutChart } from './charts/ExpenseDonutChart'
import { FlowBars } from './charts/FlowBars'
import { SummaryCards } from './charts/SummaryCards'

export function FinanceCharts({ summary }: { summary: FinanceSummary }) {
  return (
    <div className="flex flex-col gap-6">
      <SummaryCards summary={summary} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="section-title mb-3">Egresos por sobre</h2>
          <ExpenseDonutChart summary={summary} />
        </div>
        <div className="flex flex-col">
          <h2 className="section-title mb-3">Flujo de caja</h2>
          <div className="flex-1">
            <FlowBars summary={summary} />
          </div>
        </div>
      </div>
    </div>
  )
}
