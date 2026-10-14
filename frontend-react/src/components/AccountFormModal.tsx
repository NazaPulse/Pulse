import { useAccountForm } from '../hooks/useAccountForm'
import type { Account, AccountCreateRequest, AccountType } from '@shared/types'
import { ACCOUNT_TYPES } from '@shared/utils/accountForm'
import { Alert } from './Alert'
import { Field } from './Field'
import { FormActions } from './FormActions'
import { Modal } from './Modal'
import { Select } from './Select'

type AccountFormModalProps = {
  account?: Account | null
  onClose: () => void
  onSubmit: (values: AccountCreateRequest) => Promise<void>
}

export function AccountFormModal({ account, onClose, onSubmit }: AccountFormModalProps) {
  const form = useAccountForm(account, onSubmit)
  const { values, setField, submitting, isEditing } = form

  return (
    <Modal title={isEditing ? 'Editar cuenta' : 'Nueva cuenta'} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
        {form.error ? <Alert variant="error">{form.error}</Alert> : null}

        <Field
          label="Nombre"
          name="name"
          placeholder="Cuenta Corriente Santander"
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          disabled={submitting}
          maxLength={100}
          required
        />

        <Select
          label="Tipo de cuenta"
          value={values.type}
          onChange={(e) => setField('type', e.target.value as AccountType)}
          disabled={submitting}
        >
          {ACCOUNT_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {!isEditing ? (
          <Field
            label="Saldo inicial"
            type="number"
            step="0.01"
            name="initial_balance"
            placeholder="0"
            value={values.initialBalance}
            onChange={(e) => setField('initialBalance', e.target.value)}
            disabled={submitting}
            hint="Se usa como base para calcular el saldo de la cuenta."
          />
        ) : null}

        <FormActions
          submitting={submitting}
          canSubmit={form.canSubmit}
          loadingLabel="Guardando…"
          onCancel={onClose}
        >
          {isEditing ? 'Guardar cambios' : 'Crear cuenta'}
        </FormActions>
      </form>
    </Modal>
  )
}
