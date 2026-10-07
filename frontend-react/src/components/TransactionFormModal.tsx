import { useState } from 'react'
import type { FormEvent } from 'react'

import { extractErrorMessage } from '../lib/api'
import { currencyFormatter } from '../lib/format'
import type { Account, Category, CreateTransactionDTO, TransactionType } from '../lib/types'
import { Alert } from './Alert'
import { Field } from './Field'
import { Modal } from './Modal'
import { Select } from './Select'
import { SubmitButton } from './SubmitButton'

const DESCRIPTION_MAX_LENGTH = 255

const TYPE_OPTIONS: { value: TransactionType; label: string; active: string }[] = [
  { value: 'income', label: 'Ingreso', active: 'bg-emerald-600 text-white shadow-sm' },
  { value: 'expense', label: 'Egreso', active: 'bg-red-600 text-white shadow-sm' },
]

/** Fecha local de hoy en formato `YYYY-MM-DD` (valor de `<input type="date">`). */
function todayLocal(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

type TransactionFormModalProps = {
  accounts: Account[]
  categories: Category[]
  onClose: () => void
  onSubmit: (values: CreateTransactionDTO) => Promise<void>
}

export function TransactionFormModal({
  accounts,
  categories,
  onClose,
  onSubmit,
}: TransactionFormModalProps) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(accounts.length === 1 ? accounts[0].id : '')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(todayLocal)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedAmount = Number(amount)
  const amountValid = amount.trim() !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0
  const isExpense = type === 'expense'
  const selectedAccount = accounts.find((a) => a.id === accountId) ?? null

  const canSubmit =
    amountValid &&
    Boolean(accountId) &&
    (!isExpense || Boolean(categoryId)) &&
    Boolean(date) &&
    description.length <= DESCRIPTION_MAX_LENGTH &&
    !submitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    try {
      const payload: CreateTransactionDTO = {
        amount: parsedAmount,
        type,
        account_id: accountId,
        // Mediodía local para que la fecha no cambie de día al pasar a UTC.
        date: new Date(`${date}T12:00:00`).toISOString(),
      }
      if (categoryId) payload.category_id = categoryId
      const trimmed = description.trim()
      if (trimmed) payload.description = trimmed

      await onSubmit(payload)
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo registrar la transacción.'))
      setSubmitting(false)
    }
  }

  if (accounts.length === 0) {
    return (
      <Modal title="Nueva transacción" onClose={onClose}>
        <p className="text-sm text-slate-600">
          Necesitás al menos una cuenta para registrar movimientos. Creá una desde la sección
          Cuentas.
        </p>
      </Modal>
    )
  }

  return (
    <Modal title="Nueva transacción" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {error ? <Alert variant="error">{error}</Alert> : null}

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Tipo</span>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="radiogroup">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={type === option.value}
                disabled={submitting}
                onClick={() => setType(option.value)}
                className={[
                  'rounded-md px-3 py-2 text-sm font-semibold transition',
                  type === option.value ? option.active : 'text-slate-600 hover:text-slate-900',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <Field
          label="Monto"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          name="amount"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={submitting}
          error={amount.trim() !== '' && !amountValid ? 'El monto debe ser mayor a 0.' : undefined}
          required
        />

        <Select
          label="Cuenta"
          name="account_id"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          disabled={submitting}
          required
        >
          <option value="">Seleccioná una cuenta</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} — {currencyFormatter.format(account.balance)}
            </option>
          ))}
        </Select>
        {isExpense && selectedAccount && amountValid && parsedAmount > selectedAccount.balance ? (
          <p className="-mt-2 text-xs text-amber-600">
            El monto supera el saldo disponible de la cuenta.
          </p>
        ) : null}

        <Select
          label={isExpense ? 'Sobre' : 'Sobre (opcional)'}
          name="category_id"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={submitting}
          required={isExpense}
        >
          <option value="">{isExpense ? 'Seleccioná un sobre' : 'Sin sobre'}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        {isExpense && categories.length === 0 ? (
          <p className="-mt-2 text-xs text-amber-600">
            Los egresos requieren un sobre. Creá uno desde la sección Sobres de presupuesto.
          </p>
        ) : null}

        <Field
          label="Fecha"
          type="date"
          name="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={submitting}
          required
        />

        <Field
          label="Descripción (opcional)"
          name="description"
          placeholder="Compra semanal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
          maxLength={DESCRIPTION_MAX_LENGTH}
        />

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <div className="sm:w-44">
            <SubmitButton loading={submitting} disabled={!canSubmit} loadingLabel="Registrando…">
              Registrar
            </SubmitButton>
          </div>
        </div>
      </form>
    </Modal>
  )
}
