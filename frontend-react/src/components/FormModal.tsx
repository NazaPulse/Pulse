import type { FormEvent, ReactNode } from 'react'

import { Alert } from './Alert'
import { FormActions } from './FormActions'
import { Modal } from './Modal'

type FormModalProps = {
  title: string
  error: string | null
  submitting: boolean
  canSubmit: boolean
  submitLabel: string
  loadingLabel?: string
  submitWidthClass?: string
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
}

/** Modal con formulario: aviso de error, campos (children) y pie "Cancelar" + envío. */
export function FormModal(props: FormModalProps) {
  const { title, error, submitting, canSubmit, submitLabel, onClose, onSubmit, children } = props
  return (
    <Modal title={title} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        {error ? <Alert variant="error">{error}</Alert> : null}
        {children}
        <FormActions
          submitting={submitting}
          canSubmit={canSubmit}
          loadingLabel={props.loadingLabel ?? 'Guardando…'}
          submitWidthClass={props.submitWidthClass}
          onCancel={onClose}
        >
          {submitLabel}
        </FormActions>
      </form>
    </Modal>
  )
}
