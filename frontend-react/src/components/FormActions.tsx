import type { ReactNode } from 'react'

import { SubmitButton } from './SubmitButton'

interface FormActionsProps {
  submitting: boolean
  canSubmit: boolean
  loadingLabel: string
  onCancel: () => void
  submitWidthClass?: string
  children: ReactNode
}

/** Pie común de los formularios en modal: "Cancelar" + botón de envío. */
export function FormActions(props: FormActionsProps) {
  const { submitting, canSubmit, loadingLabel, onCancel, submitWidthClass = 'sm:w-40', children } = props
  return (
    <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="rounded-lg border border-line-strong bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-fg-soft transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Cancelar
      </button>
      <div className={submitWidthClass}>
        <SubmitButton loading={submitting} disabled={!canSubmit} loadingLabel={loadingLabel}>
          {children}
        </SubmitButton>
      </div>
    </div>
  )
}
