// Operaciones del panel de Finanzas (carga conjunta y altas/ediciones/bajas), independientes del
// framework. Cada frontend solo guarda el estado de pantalla y llama a estas funciones.
import type { createApi } from './api'
import type {
  Account,
  AccountCreateRequest,
  Category,
  CategoryUpdateRequest,
  FinanceSummary,
  Transaction,
} from './types'
import type { DeleteTarget } from './utils/deleteTarget'

export type FinanceClient = ReturnType<typeof createApi>

export interface FinanceData {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  summary: FinanceSummary | null
}

export const EMPTY_FINANCE_DATA: FinanceData = { accounts: [], categories: [], transactions: [], summary: null }

export const FINANCE_LOAD_ERROR = 'No se pudieron cargar tus datos financieros.'
export const DELETE_ERROR = 'No se pudo eliminar el registro.'

/** Carga cuentas, sobres, historial y resumen juntos: cualquier alta o baja impacta saldos y métricas. */
export async function fetchFinanceData(client: FinanceClient): Promise<FinanceData> {
  const [accounts, categories, transactions, summary] = await Promise.all([
    client.getAccounts(),
    client.getCategories(),
    client.getTransactions(),
    client.getFinanceSummary(),
  ])
  return { accounts, categories, transactions, summary }
}

/** Alta, o edición si hay una cuenta seleccionada (solo nombre y tipo son editables). */
export async function saveAccount(
  client: FinanceClient,
  editing: Account | null | undefined,
  values: AccountCreateRequest,
): Promise<void> {
  if (editing) await client.updateAccount(editing.id, { name: values.name, type: values.type })
  else await client.createAccount(values)
}

export async function saveCategory(
  client: FinanceClient,
  editing: Category | null | undefined,
  values: CategoryUpdateRequest,
): Promise<void> {
  if (editing) await client.updateCategory(editing.id, values)
  else await client.createCategory(values)
}

export async function removeTarget(client: FinanceClient, target: DeleteTarget): Promise<void> {
  await (target.kind === 'account' ? client.deleteAccount(target.item.id) : client.deleteCategory(target.item.id))
}
