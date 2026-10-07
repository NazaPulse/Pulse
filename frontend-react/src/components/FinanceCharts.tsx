import { useState } from 'react'

import { currencyFormatter } from '../lib/format'
import type { CategorySummary, FinanceSummary } from '../lib/types'

// Paleta de respaldo para sobres sin color válido (`color` puede llegar como '').
const FALLBACK_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6']

function sliceColor(category: CategorySummary, index: number): string {
  return /^#[0-9A-Fa-f]{6}$/.test(category.color)
    ? category.color
    : FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

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

const RADIUS = 60
const STROKE = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 2 // separación visual entre porciones (en unidades de longitud del trazo)

export function ExpenseDonutChart({ summary }: { summary: FinanceSummary }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const categories = summary.by_category
  const total = categories.reduce((acc, c) => acc + c.total_amount, 0)

  if (categories.length === 0 || total <= 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
        Todavía no hay egresos registrados para mostrar el desglose por sobre.
      </div>
    )
  }

  const active = categories.find((c) => c.category_id === activeId) ?? null
  const hasGap = categories.length > 1

  const lengths = categories.map((c) => (c.total_amount / total) * CIRCUMFERENCE)
  const slices = categories.map((category, index) => ({
    category,
    color: sliceColor(category, index),
    dash: Math.max(lengths[index] - (hasGap ? GAP : 0), 0.5),
    // Desplazamiento acumulado de las porciones anteriores.
    offset: lengths.slice(0, index).reduce((acc, l) => acc + l, 0),
  }))

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start">
      <div className="relative h-48 w-48 shrink-0">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label="Egresos por sobre">
          <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#F1F5F9" strokeWidth={STROKE} />
          {slices.map(({ category, color, dash, offset: sliceOffset }) => {
            const dimmed = activeId !== null && activeId !== category.category_id
            return (
              <circle
                key={category.category_id}
                cx="80"
                cy="80"
                r={RADIUS}
                fill="none"
                stroke={color}
                strokeWidth={activeId === category.category_id ? STROKE + 4 : STROKE}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={-sliceOffset}
                className="cursor-pointer transition-all duration-200"
                style={{ opacity: dimmed ? 0.35 : 1 }}
                onMouseEnter={() => setActiveId(category.category_id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() =>
                  setActiveId((prev) => (prev === category.category_id ? null : category.category_id))
                }
              >
                <title>{`${category.category_name}: ${currencyFormatter.format(category.total_amount)}`}</title>
              </circle>
            )
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="max-w-[7rem] truncate text-xs text-slate-500">
            {active ? active.category_name : 'Total egresos'}
          </span>
          <span className="text-base font-semibold tabular-nums text-slate-900">
            {currencyFormatter.format(active ? active.total_amount : summary.total_expenses)}
          </span>
          {active ? <span className="text-xs text-slate-500">{active.percentage}%</span> : null}
        </div>
      </div>

      <ul className="flex w-full flex-col gap-1">
        {slices.map(({ category, color }) => (
          <li key={category.category_id}>
            <button
              type="button"
              onMouseEnter={() => setActiveId(category.category_id)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(category.category_id)}
              onBlur={() => setActiveId(null)}
              className={[
                'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition',
                activeId === category.category_id ? 'bg-slate-100' : 'hover:bg-slate-50',
              ].join(' ')}
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="min-w-0 flex-1 truncate text-slate-700">{category.category_name}</span>
              <span className="tabular-nums text-slate-500">{category.percentage}%</span>
              <span className="w-28 text-right font-medium tabular-nums text-slate-900">
                {currencyFormatter.format(category.total_amount)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
