import { useCallback, useEffect, useState } from 'react'

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
  const [data, setData] = useState<FinanceData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      setData(await fetchFinanceData())
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar tus datos financieros.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, loading, error, setError, reload }
}
