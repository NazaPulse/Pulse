import { useAccountForm } from '../hooks/useAccountForm'
import type { Account, AccountCreateRequest, AccountType } from '@shared/types'
import { ACCOUNT_TYPES } from '@shared/utils/accountForm'
import { Field } from './Field'
import { FormModal } from './FormModal'
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
    <FormModal
      title={isEditing ? 'Editar cuenta' : 'Nueva cuenta'}
      submitLabel={isEditing ? 'Guardar cambios' : 'Crear cuenta'}
      error={form.error}
      submitting={submitting}
      canSubmit={form.canSubmit}
      onClose={onClose}
      onSubmit={form.handleSubmit}
    >
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
    </FormModal>
  )
}
