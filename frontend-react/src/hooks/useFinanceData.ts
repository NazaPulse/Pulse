import { EMPTY_FINANCE_DATA, FINANCE_LOAD_ERROR, fetchFinanceData } from '@shared/financeActions'
import { api } from '../lib/api'
import { useLoader } from './useLoader'

const loadFinanceData = () => fetchFinanceData(api)

// El spinner solo se muestra en la carga inicial; los alta/baja recargan en segundo plano.
export function useFinanceData() {
  return useLoader(loadFinanceData, EMPTY_FINANCE_DATA, FINANCE_LOAD_ERROR)
}

export type { FinanceData } from '@shared/financeActions'
