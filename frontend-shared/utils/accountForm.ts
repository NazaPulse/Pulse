import type { Account, AccountCreateRequest, AccountType } from '../types'
import { isValidName } from '../validation'
import { withDefaults } from './withDefaults'

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'bank', label: 'Banco' },
  { value: 'wallet', label: 'Billetera virtual' },
  { value: 'cash', label: 'Efectivo' },
]

export const ACCOUNT_TYPE_LABEL = Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.value, t.label])) as Record<
  AccountType,
  string
>

export const ACCOUNT_TYPE_ICON: Record<AccountType, string> = { bank: '🏦', wallet: '📱', cash: '💵' }

export interface AccountFormValues {
  name: string
  type: AccountType
  initialBalance: string
}

const NEW_ACCOUNT_VALUES: AccountFormValues = { name: '', type: 'bank', initialBalance: '0' }

export function initialAccountValues(account?: Account | null): AccountFormValues {
  if (!account) return { ...NEW_ACCOUNT_VALUES }
  const values = { name: account.name, type: account.type, initialBalance: String(account.initial_balance ?? 0) }
  return withDefaults(values, NEW_ACCOUNT_VALUES)
}

/** Al editar, el saldo inicial no se envía: solo se valida al crear. */
export function canSubmitAccount(values: AccountFormValues, isEditing: boolean): boolean {
  if (!isValidName(values.name)) return false
  return isEditing || Number.isFinite(Number(values.initialBalance))
}

export function buildAccountPayload(values: AccountFormValues): AccountCreateRequest {
  const parsed = Number(values.initialBalance)
  return {
    name: values.name.trim(),
    type: values.type,
    initial_balance: Number.isFinite(parsed) ? parsed : 0,
  }
}
