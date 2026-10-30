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

type Lookups = { accountName: Map<string, string>; categoryName: Map<string, string> }
type RowsProps = Lookups & { sorted: Transaction[] }

const categoryOf = (tx: Transaction, { categoryName }: Lookups) =>
  tx.category_id ? categoryName.get(tx.category_id) : undefined

function labelFor(tx: Transaction, lookups: Lookups) {
  return (
    tx.description ||
    (tx.category_id ? lookups.categoryName.get(tx.category_id) : null) ||
    (tx.type === 'income' ? 'Ingreso' : 'Egreso')
  )
}

/** Mobile: tarjetas. */
function TransactionCards({ sorted, ...lookups }: RowsProps) {
  return (
    <ul className="flex flex-col gap-2 md:hidden">
      {sorted.map((tx) => (
        <li key={tx.id} className="flex items-center justify-between gap-3 pulse-card p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">{labelFor(tx, lookups)}</p>
            <p className="mt-0.5 truncate text-xs text-fg-muted">
              {formatDate(tx.date)} · {lookups.accountName.get(tx.account_id) ?? 'Cuenta'}
              {categoryOf(tx, lookups) ? ` · ${categoryOf(tx, lookups)}` : ''}
            </p>
          </div>
          <span className={`shrink-0 text-base font-semibold tabular-nums ${amountClass(tx)}`}>{signedAmount(tx)}</span>
        </li>
      ))}
    </ul>
  )
}

function TransactionRow({ tx, lookups }: { tx: Transaction; lookups: Lookups }) {
  return (
    <tr className="transition hover:bg-white/5">
      <td className="whitespace-nowrap px-4 py-3 text-fg-soft">{formatDate(tx.date)}</td>
      <td className="max-w-[14rem] truncate px-4 py-3 text-fg">{tx.description || '—'}</td>
      <td className="px-4 py-3">
        <TypeBadge tx={tx} />
      </td>
      <td className="px-4 py-3 text-fg-soft">{lookups.accountName.get(tx.account_id) ?? '—'}</td>
      <td className="px-4 py-3 text-fg-soft">{categoryOf(tx, lookups) || '—'}</td>
      <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${amountClass(tx)}`}>
        {signedAmount(tx)}
      </td>
    </tr>
  )
}

function TableHead() {
  return (
    <thead className="border-b border-line bg-white/5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-fg-muted">
      <tr>
        <th scope="col" className="px-4 py-3 font-medium">
          Fecha
        </th>
        <th scope="col" className="px-4 py-3 font-medium">
          Descripción
        </th>
        <th scope="col" className="px-4 py-3 font-medium">
          Tipo
        </th>
        <th scope="col" className="px-4 py-3 font-medium">
          Cuenta
        </th>
        <th scope="col" className="px-4 py-3 font-medium">
          Sobre
        </th>
        <th scope="col" className="px-4 py-3 text-right font-medium">
          Monto
        </th>
      </tr>
    </thead>
  )
}

/** Escritorio: tabla. */
function TransactionTable({ sorted, ...lookups }: RowsProps) {
  return (
    <div className="hidden overflow-hidden pulse-card md:block">
      <table className="w-full text-left text-sm">
        <TableHead />
        <tbody className="divide-y divide-line">
          {sorted.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} lookups={lookups} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const timeOf = (value: string) => new Date(value).getTime()

// El backend ya ordena por fecha desc; se reordena por robustez.
const newestFirst = (a: Transaction, b: Transaction) =>
  timeOf(b.date) - timeOf(a.date) || timeOf(b.created_at) - timeOf(a.created_at)

export function TransactionHistory({ transactions, accounts, categories }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <p className="pulse-empty px-4 py-6 text-center text-sm text-fg-muted">
        Todavía no registraste movimientos. Usá “+ Nueva transacción” para empezar.
      </p>
    )
  }

  const lookups: Lookups = {
    accountName: new Map(accounts.map((a) => [a.id, a.name])),
    categoryName: new Map(categories.map((c) => [c.id, c.name])),
  }
  const sorted = [...transactions].sort(newestFirst)

  return (
    <>
      <TransactionCards sorted={sorted} {...lookups} />
      <TransactionTable sorted={sorted} {...lookups} />
    </>
  )
}
