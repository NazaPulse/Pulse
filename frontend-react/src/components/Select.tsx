import { useId } from 'react'
import type { ReactNode, SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  children: ReactNode
}

export function Select({ label, className, children, ...selectProps }: SelectProps) {
  const id = useId()

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg-soft">
        {label}
      </label>
      <select
        id={id}
        className={[
          'w-full rounded-lg border border-line-strong bg-canvas/60 px-3.5 py-2.5 text-fg outline-none transition',
          'focus:ring-2 focus:ring-accent/30 focus:border-accent',
          'disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-fg-dim',
          className ?? '',
        ].join(' ')}
        {...selectProps}
      >
        {children}
      </select>
    </div>
  )
}
