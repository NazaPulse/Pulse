import { currencyFormatter } from '@shared/format'
import type { FinanceSummary } from '@shared/types'

type BarProps = {
  label: string
  value: number
  max: number
  color: string
}

function FlowBar({ label, value, max, color }: BarProps) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-fg-soft">{label}</span>
        <span className="font-display font-semibold tabular-nums text-fg">
          {currencyFormatter.format(value)}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            boxShadow: `0 0 12px ${color}88`,
          }}
        />
      </div>
    </div>
  )
}

/** Barras comparativas ingresos vs. egresos (misma escala). */
export function FlowBars({ summary }: { summary: FinanceSummary }) {
  const max = Math.max(summary.total_income, summary.total_expenses)
  const ratio = summary.total_income > 0 ? Math.round((summary.total_expenses / summary.total_income) * 100) : null

  return (
    <div className="pulse-card flex h-full flex-col gap-6 p-5">
      <FlowBar label="Ingresos" value={summary.total_income} max={max} color="#86E3AE" />
      <FlowBar label="Egresos" value={summary.total_expenses} max={max} color="#FF9FC5" />
      <p className="mt-auto border-t border-line pt-4 text-xs text-fg-muted">
        {ratio === null
          ? 'Cargá ingresos para ver qué parte se va en egresos.'
          : `Los egresos equivalen al ${ratio}% de tus ingresos.`}
      </p>
    </div>
  )
}
