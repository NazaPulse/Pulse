import type { ReactNode } from 'react'

interface DashboardSectionProps {
  title: string
  actionLabel: string
  onAction: () => void
  children: ReactNode
}

export function DashboardSection({ title, actionLabel, onAction, children }: DashboardSectionProps) {
  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={onAction}
          className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          {actionLabel}
        </button>
      </div>
      {children}
    </div>
  )
}
