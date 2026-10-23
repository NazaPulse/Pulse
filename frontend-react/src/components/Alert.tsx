import type { ReactNode } from 'react'

type AlertProps = {
  variant: 'error' | 'success'
  children: ReactNode
}

const STYLES: Record<AlertProps['variant'], string> = {
  error: 'border-danger/30 bg-danger/10 text-danger-soft',
  success: 'border-ok/30 bg-ok/10 text-ok',
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
