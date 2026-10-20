import { currencyFormatter, formatDate } from '@shared/format'
import type { Account, Category, Transaction } from '@shared/types'

type TransactionHistoryProps = {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
}

function signedAmount(tx: Transaction): string {
  return `${tx.type === 'income' ? '+' : '-'}${currencyFormatter.format(tx.amount)}`
}

function amountClass(tx: Transaction): string {
  return tx.type === 'income' ? 'text-ok' : 'text-danger-soft'
}

function TypeBadge({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === 'income'
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        isIncome ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger-soft',
      ].join(' ')}
    >
      {isIncome ? 'Ingreso' : 'Egreso'}
    </span>
  )
}

export function TransactionHistory({ transactions, accounts, categories }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <p className="pulse-empty px-4 py-6 text-center text-sm text-fg-muted">
        Todavía no registraste movimientos. Usá “+ Nueva transacción” para empezar.
      </p>
    )
  }

  const accountName = new Map(accounts.map((a) => [a.id, a.name]))
  const categoryName = new Map(categories.map((c) => [c.id, c.name]))

  // El backend ya ordena por fecha desc; se reordena por robustez.
  const sorted = [...transactions].sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const labelFor = (tx: Transaction) =>
    tx.description || (tx.category_id ? categoryName.get(tx.category_id) : null) || (tx.type === 'income' ? 'Ingreso' : 'Egreso')

  return (
    <>
      {/* Mobile: tarjetas */}
      <ul className="flex flex-col gap-2 md:hidden">
        {sorted.map((tx) => (
          <li
            key={tx.id}
            className="flex items-center justify-between gap-3 pulse-card p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{labelFor(tx)}</p>
              <p className="mt-0.5 truncate text-xs text-fg-muted">
                {formatDate(tx.date)} · {accountName.get(tx.account_id) ?? 'Cuenta'}
                {tx.category_id && categoryName.get(tx.category_id)
                  ? ` · ${categoryName.get(tx.category_id)}`
                  : ''}
              </p>
            </div>
            <span className={`shrink-0 text-base font-semibold tabular-nums ${amountClass(tx)}`}>
              {signedAmount(tx)}
            </span>
          </li>
        ))}
      </ul>

      {/* Escritorio: tabla */}
      <div className="hidden overflow-hidden pulse-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-white/5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-fg-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Fecha</th>
              <th scope="col" className="px-4 py-3 font-medium">Descripción</th>
              <th scope="col" className="px-4 py-3 font-medium">Tipo</th>
              <th scope="col" className="px-4 py-3 font-medium">Cuenta</th>
              <th scope="col" className="px-4 py-3 font-medium">Sobre</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((tx) => (
              <tr key={tx.id} className="transition hover:bg-white/5">
                <td className="whitespace-nowrap px-4 py-3 text-fg-soft">{formatDate(tx.date)}</td>
                <td className="max-w-[14rem] truncate px-4 py-3 text-fg">{tx.description || '—'}</td>
                <td className="px-4 py-3"><TypeBadge tx={tx} /></td>
                <td className="px-4 py-3 text-fg-soft">{accountName.get(tx.account_id) ?? '—'}</td>
                <td className="px-4 py-3 text-fg-soft">
                  {(tx.category_id && categoryName.get(tx.category_id)) || '—'}
                </td>
                <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${amountClass(tx)}`}>
                  {signedAmount(tx)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
