import { useState } from 'react'
import type { FormEvent } from 'react'

import { extractErrorMessage } from '../lib/api'
import type { Account, AccountType } from '../lib/types'
import { isValidName } from '../lib/validation'
import { Alert } from './Alert'
import { Field } from './Field'
import { Modal } from './Modal'
import { Select } from './Select'
import { SubmitButton } from './SubmitButton'

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'bank', label: 'Banco' },
  { value: 'wallet', label: 'Billetera virtual' },
  { value: 'cash', label: 'Efectivo' },
]

type AccountFormModalProps = {
  account?: Account | null
  onClose: () => void
  onSubmit: (values: { name: string; type: AccountType; initial_balance: number }) => Promise<void>
}

export function AccountFormModal({ account, onClose, onSubmit }: AccountFormModalProps) {
  const isEditing = Boolean(account)

  const [name, setName] = useState(account?.name ?? '')
  const [type, setType] = useState<AccountType>(account?.type ?? 'bank')
  const [initialBalance, setInitialBalance] = useState(
    account ? String(account.initial_balance ?? 0) : '0',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedBalance = Number(initialBalance)
  const canSubmit =
    isValidName(name) && !submitting && (isEditing || Number.isFinite(parsedBalance))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        type,
        initial_balance: Number.isFinite(parsedBalance) ? parsedBalance : 0,
      })
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo guardar la cuenta.'))
      setSubmitting(false)
    }
  }

  return (
    <Modal title={isEditing ? 'Editar cuenta' : 'Nueva cuenta'} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {error ? <Alert variant="error">{error}</Alert> : null}

        <Field
          label="Nombre"
          name="name"
          placeholder="Cuenta Corriente Santander"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          maxLength={100}
          required
        />

        <Select
          label="Tipo de cuenta"
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
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
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            disabled={submitting}
            hint="Se usa como base para calcular el saldo de la cuenta."
          />
        ) : null}

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <div className="sm:w-40">
            <SubmitButton loading={submitting} disabled={!canSubmit} loadingLabel="Guardando…">
              {isEditing ? 'Guardar cambios' : 'Crear cuenta'}
            </SubmitButton>
          </div>
        </div>
      </form>
    </Modal>
  )
}
