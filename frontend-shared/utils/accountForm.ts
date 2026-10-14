import type { Account, AccountCreateRequest, AccountType } from '../types'
import { isValidName } from '../validation'

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'bank', label: 'Banco' },
  { value: 'wallet', label: 'Billetera virtual' },
  { value: 'cash', label: 'Efectivo' },
]

export interface AccountFormValues {
  name: string
  type: AccountType
  initialBalance: string
}

export function initialAccountValues(account?: Account | null): AccountFormValues {
  return {
    name: account?.name ?? '',
    type: account?.type ?? 'bank',
    initialBalance: account ? String(account.initial_balance ?? 0) : '0',
  }
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
