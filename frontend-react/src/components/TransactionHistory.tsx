import { currencyFormatter, formatDate } from '../lib/format'
import type { Account, Category, Transaction } from '../lib/types'

type TransactionHistoryProps = {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
}

function signedAmount(tx: Transaction): string {
  return `${tx.type === 'income' ? '+' : '-'}${currencyFormatter.format(tx.amount)}`
}

function amountClass(tx: Transaction): string {
  return tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
}

function TypeBadge({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === 'income'
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
      ].join(' ')}
    >
      {isIncome ? 'Ingreso' : 'Egreso'}
    </span>
  )
}

export function TransactionHistory({ transactions, accounts, categories }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
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
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{labelFor(tx)}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
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
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Fecha</th>
              <th scope="col" className="px-4 py-3 font-medium">Descripción</th>
              <th scope="col" className="px-4 py-3 font-medium">Tipo</th>
              <th scope="col" className="px-4 py-3 font-medium">Cuenta</th>
              <th scope="col" className="px-4 py-3 font-medium">Sobre</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((tx) => (
              <tr key={tx.id} className="transition hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(tx.date)}</td>
                <td className="max-w-[14rem] truncate px-4 py-3 text-slate-900">{tx.description || '—'}</td>
                <td className="px-4 py-3"><TypeBadge tx={tx} /></td>
                <td className="px-4 py-3 text-slate-600">{accountName.get(tx.account_id) ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">
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
