import type { ReactNode } from 'react'

interface DashboardSectionProps {
  title: string
  actionLabel: string
  onAction: () => void
  children: ReactNode
}

export function DashboardSection({ title, actionLabel, onAction, children }: DashboardSectionProps) {
  return (
    <div className="mt-12">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="section-title">{title}</h2>
        <button
          type="button"
          onClick={onAction}
          className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-ink shadow-glow transition hover:bg-accent-hover"
        >
          {actionLabel}
        </button>
      </div>
      {children}
    </div>
  )
}
