import type { Account, CreateTransactionDTO, TransactionType } from '../types'

export const DESCRIPTION_MAX_LENGTH = 255

export const TYPE_OPTIONS: { value: TransactionType; label: string; active: string }[] = [
  { value: 'income', label: 'Ingreso', active: 'bg-emerald-600 text-white shadow-sm' },
  { value: 'expense', label: 'Egreso', active: 'bg-red-600 text-white shadow-sm' },
]

export interface TransactionFormValues {
  type: TransactionType
  amount: string
  accountId: string
  categoryId: string
  date: string
  description: string
}

/** Fecha local de hoy en formato `YYYY-MM-DD` (valor de `<input type="date">`). */
export function todayLocal(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export function initialTransactionValues(accounts: Account[]): TransactionFormValues {
  return {
    type: 'expense',
    amount: '',
    accountId: accounts.length === 1 ? accounts[0].id : '',
    categoryId: '',
    date: todayLocal(),
    description: '',
  }
}

export function isAmountValid(amount: string): boolean {
  const parsed = Number(amount)
  return amount.trim() !== '' && Number.isFinite(parsed) && parsed > 0
}

export function amountError(amount: string): string | undefined {
  if (amount.trim() === '' || isAmountValid(amount)) return undefined
  return 'El monto debe ser mayor a 0.'
}

function hasRequiredFields(values: TransactionFormValues): boolean {
  const categoryOk = values.type !== 'expense' || Boolean(values.categoryId)
  return Boolean(values.accountId) && Boolean(values.date) && categoryOk
}

export function canSubmitTransaction(values: TransactionFormValues): boolean {
  if (!isAmountValid(values.amount)) return false
  if (values.description.length > DESCRIPTION_MAX_LENGTH) return false
  return hasRequiredFields(values)
}

export function exceedsBalance(values: TransactionFormValues, accounts: Account[]): boolean {
  if (values.type !== 'expense' || !isAmountValid(values.amount)) return false
  const account = accounts.find((a) => a.id === values.accountId)
  return account !== undefined && Number(values.amount) > account.balance
}

export function buildTransactionPayload(values: TransactionFormValues): CreateTransactionDTO {
  const payload: CreateTransactionDTO = {
    amount: Number(values.amount),
    type: values.type,
    account_id: values.accountId,
    // Mediodía local para que la fecha no cambie de día al pasar a UTC.
    date: new Date(`${values.date}T12:00:00`).toISOString(),
  }
  if (values.categoryId) payload.category_id = values.categoryId
  const trimmed = values.description.trim()
  if (trimmed) payload.description = trimmed
  return payload
}
