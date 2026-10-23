import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow: string
  title: string
  subtitle?: string
  actions?: ReactNode
}

/** Cabecera de cada sección: etiqueta técnica, título grande y línea de luz. */
export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm text-fg-muted">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className="mt-6 h-px bg-gradient-to-r from-accent/60 via-line-strong to-transparent" />
    </header>
  )
}
