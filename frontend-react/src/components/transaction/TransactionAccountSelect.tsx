import { currencyFormatter } from '@shared/format'
import type { Account } from '@shared/types'
import { Select } from '../Select'

interface TransactionAccountSelectProps {
  accounts: Account[]
  value: string
  disabled: boolean
  exceedsBalance: boolean
  onChange: (value: string) => void
}

export function TransactionAccountSelect(props: TransactionAccountSelectProps) {
  const { accounts, value, disabled, exceedsBalance, onChange } = props
  return (
    <>
      <Select
        label="Cuenta"
        name="account_id"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
      >
        <option value="">Seleccioná una cuenta</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} — {currencyFormatter.format(account.balance)}
          </option>
        ))}
      </Select>
      {exceedsBalance ? (
        <p className="-mt-2 text-xs text-amber-600">
          El monto supera el saldo disponible de la cuenta.
        </p>
      ) : null}
    </>
  )
}
