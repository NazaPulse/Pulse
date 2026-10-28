import { CATEGORY_COLORS, CATEGORY_LABELS, durationLabel } from '@shared/schedule'
import type { CategoryTotals } from '@shared/schedule'

type DaySummaryProps = {
  rows: CategoryTotals[]
  planned: number
  actual: number
  adherence: number | null
}

/** Planificado vs. real del día, por categoría, con el porcentaje de cumplimiento. */
export function DaySummary({ rows, planned, actual, adherence }: DaySummaryProps) {
  const scale = Math.max(1, ...rows.flatMap((row) => [row.planned, row.actual]))

  return (
    <section aria-label="Resumen del día" className="pulse-card p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Planificado vs. real</p>
          <p className="mt-1 font-mono text-xs text-fg-muted">
            {durationLabel(actual)} reales de {durationLabel(planned)} planificados
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-bold text-accent text-glow">{adherence === null ? '—' : `${adherence}%`}</p>
          <p className="text-[0.6875rem] uppercase tracking-wider text-fg-dim">Cumplimiento</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-fg-dim">Todavía no hay bloques este día.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {rows.map((row) => {
            const color = CATEGORY_COLORS[row.category]
            return (
              <li key={row.category} className="grid grid-cols-[6rem_1fr_auto] items-center gap-3 text-xs">
                <span className="text-fg-soft">{CATEGORY_LABELS[row.category]}</span>
                <span className="relative h-3 rounded-full bg-white/5" aria-hidden="true">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full border"
                    style={{ width: `${(row.planned / scale) * 100}%`, backgroundColor: `${color}26`, borderColor: `${color}66` }}
                  />
                  <span
                    className="absolute bottom-0 left-0 h-1.5 rounded-full"
                    style={{ width: `${(row.actual / scale) * 100}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                  />
                </span>
                <span className="font-mono text-fg-muted">
                  {durationLabel(row.actual)} / {durationLabel(row.planned)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
