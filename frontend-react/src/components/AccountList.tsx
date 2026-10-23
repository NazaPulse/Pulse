import { currencyFormatter } from '@shared/format'
import type { Account } from '@shared/types'
import { ACCOUNT_TYPE_ICON, ACCOUNT_TYPE_LABEL } from '@shared/utils/accountForm'
import { RowActions } from './IconButton'

type AccountListProps = {
  accounts: Account[]
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
}

export function AccountList({ accounts, onEdit, onDelete }: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <p className="pulse-empty px-4 py-6 text-center text-sm text-fg-muted">
        Todavía no tenés cuentas cargadas. Creá la primera con el botón de arriba.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {accounts.map((account) => (
        <li key={account.id} className="flex items-center justify-between gap-3 pulse-card p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg">
              {ACCOUNT_TYPE_ICON[account.type]}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{account.name}</p>
              <p className="text-xs text-fg-muted">{ACCOUNT_TYPE_LABEL[account.type]}</p>
              <p className="mt-0.5 text-base font-semibold text-fg">{currencyFormatter.format(account.balance)}</p>
            </div>
          </div>
          <RowActions name={account.name} onEdit={() => onEdit(account)} onDelete={() => onDelete(account)} />
        </li>
      ))}
    </ul>
  )
}
