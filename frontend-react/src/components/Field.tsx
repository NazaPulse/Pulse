import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
}

/** El error tiene prioridad sobre la ayuda, igual que en el mensaje visible. */
function describedById(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} className="text-xs text-danger-soft">
        {error}
      </p>
    )
  }
  if (!hint) return null
  return (
    <p id={`${id}-hint`} className="text-xs text-fg-muted">
      {hint}
    </p>
  )
}

export function Field(props: FieldProps) {
  const { label, hint, error, className, ...inputProps } = props
  const id = useId()
  const describedBy = describedById(id, error, hint)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg-soft">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={[
          'w-full rounded-lg border bg-canvas/60 px-3.5 py-2.5 text-fg outline-none transition',
          'placeholder:text-fg-dim',
          'focus:ring-2 focus:ring-accent/30 focus:border-accent',
          'disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-fg-dim',
          error ? 'border-danger-soft' : 'border-line-strong',
          className ?? '',
        ].join(' ')}
        {...inputProps}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
}
