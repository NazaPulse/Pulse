import { currencyFormatter } from '@shared/format'
import type { FinanceSummary } from '@shared/types'

type SummaryCardProps = {
  label: string
  value: number
  tone: 'neutral' | 'income' | 'expense'
}

const TONE_STYLES: Record<SummaryCardProps['tone'], string> = {
  neutral: 'text-slate-900',
  income: 'text-emerald-600',
  expense: 'text-red-600',
}

function SummaryCard({ label, value, tone }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${TONE_STYLES[tone]}`}>
        {currencyFormatter.format(value)}
      </p>
    </div>
  )
}

export function SummaryCards({ summary }: { summary: FinanceSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <SummaryCard label="Balance total" value={summary.total_balance} tone="neutral" />
      <SummaryCard label="Ingresos" value={summary.total_income} tone="income" />
      <SummaryCard label="Egresos" value={summary.total_expenses} tone="expense" />
    </div>
  )
}
