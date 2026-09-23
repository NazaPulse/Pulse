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
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={id}
        className={[
          'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition',
          'focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
          className ?? '',
        ].join(' ')}
        {...selectProps}
      >
        {children}
      </select>
    </div>
  )
}
