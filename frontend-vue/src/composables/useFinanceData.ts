import { onMounted, ref } from 'vue'

import {
  extractErrorMessage,
  getAccounts,
  getCategories,
  getFinanceSummary,
  getTransactions,
} from '../lib/api'
import type { Account, Category, FinanceSummary, Transaction } from '@shared/types'

export interface FinanceData {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  summary: FinanceSummary | null
}

const EMPTY_DATA: FinanceData = { accounts: [], categories: [], transactions: [], summary: null }

async function fetchFinanceData(): Promise<FinanceData> {
  const [accounts, categories, transactions, summary] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTransactions(),
    getFinanceSummary(),
  ])
  return { accounts, categories, transactions, summary }
}

// Recarga cuentas, sobres, historial y resumen juntos: cualquier alta o
// baja impacta saldos y métricas. El spinner solo se muestra en la carga inicial.
export function useFinanceData() {
  const data = ref<FinanceData>(EMPTY_DATA)
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function reload() {
    error.value = null
    try {
      data.value = await fetchFinanceData()
    } catch (err) {
      error.value = extractErrorMessage(err, 'No se pudieron cargar tus datos financieros.')
    } finally {
      loading.value = false
    }
  }

  onMounted(reload)

  return { data, loading, error, reload }
}
