import { currencyFormatter } from '@shared/format'
import type { FinanceSummary } from '@shared/types'

import type { IconName } from '@shared/icons'
import { Icon } from '../Icon'

type SummaryCardProps = {
  label: string
  value: number
  tone: 'neutral' | 'income' | 'expense'
}

const TONES: Record<SummaryCardProps['tone'], { text: string; chip: string; icon: IconName }> = {
  neutral: { text: 'text-fg', chip: 'border-accent/30 bg-accent/10 text-accent', icon: 'scale' },
  income: {
    text: 'text-chart-green',
    chip: 'border-chart-green/30 bg-chart-green/10 text-chart-green',
    icon: 'arrowUp',
  },
  expense: {
    text: 'text-chart-pink',
    chip: 'border-chart-pink/30 bg-chart-pink/10 text-chart-pink',
    icon: 'arrowDown',
  },
}

function SummaryCard({ label, value, tone }: SummaryCardProps) {
  const style = TONES[tone]
  return (
    <div className="pulse-card animate-rise p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow text-fg-muted">{label}</p>
        <span className={`grid h-8 w-8 place-items-center rounded-lg border ${style.chip}`}>
          <Icon name={style.icon} className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-4 font-display text-3xl font-bold tabular-nums tracking-tight ${style.text}`}>
        {currencyFormatter.format(value)}
      </p>
    </div>
  )
}

export function SummaryCards({ summary }: { summary: FinanceSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <SummaryCard label="Balance total" value={summary.total_balance} tone="neutral" />
      <SummaryCard label="Ingresos" value={summary.total_income} tone="income" />
      <SummaryCard label="Egresos" value={summary.total_expenses} tone="expense" />
    </div>
  )
}
