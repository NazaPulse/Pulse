import type { ReactNode } from 'react'

type AlertProps = {
  variant: 'error' | 'success'
  children: ReactNode
}

const STYLES: Record<AlertProps['variant'], string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

export function Alert({ variant, children }: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-3.5 py-2.5 text-sm ${STYLES[variant]}`}
    >
      {children}
    </div>
  )
}
