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
        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
