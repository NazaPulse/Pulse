import type { ReactNode } from 'react'

import { Spinner } from './Spinner'

type SubmitButtonProps = {
  loading: boolean
  disabled: boolean
  children: ReactNode
  loadingLabel?: string
}

export function SubmitButton({
  loading,
  disabled,
  children,
  loadingLabel = 'Procesando…',
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={[
        'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5',
        'text-sm font-semibold text-white shadow-sm transition',
        'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:bg-indigo-300',
      ].join(' ')}
    >
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
