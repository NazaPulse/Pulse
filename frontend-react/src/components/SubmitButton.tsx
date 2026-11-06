import type { ReactNode } from 'react'

import { Spinner } from './Spinner'

type SubmitButtonProps = {
  loading: boolean
  disabled: boolean
  children: ReactNode
  loadingLabel?: string
}

const SUBMIT_CLASS = [
  'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5',
  'text-sm font-semibold text-ink transition',
  'bg-accent shadow-glow hover:bg-accent-hover active:bg-accent-strong',
  'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-canvas',
  'disabled:cursor-not-allowed disabled:bg-accent/30 disabled:text-ink/50 disabled:shadow-none',
].join(' ')

export function SubmitButton({ loading, disabled, children, loadingLabel = 'Procesando…' }: SubmitButtonProps) {
  return (
    <button type="submit" disabled={disabled || loading} className={SUBMIT_CLASS}>
      {loading ? (
        <>
          <Spinner className="h-4 w-4" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}
