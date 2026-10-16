import type { DashboardModalsState } from '../../hooks/useDashboardModals'
import type { FinanceData } from '../../hooks/useFinanceData'
import { AccountList } from '../AccountList'
import { CategoryList } from '../CategoryList'
import { FinanceCharts } from '../FinanceCharts'
import { TransactionHistory } from '../TransactionHistory'
import { DashboardSection } from './DashboardSection'

interface DashboardContentProps {
  data: FinanceData
  modals: DashboardModalsState
}

export function DashboardContent({ data, modals }: DashboardContentProps) {
  const { accounts, categories, transactions, summary } = data
  return (
    <>
      {summary ? (
        <div className="mt-8">
          <FinanceCharts summary={summary} />
        </div>
      ) : null}

      <DashboardSection
        title="Cuentas"
        actionLabel="+ Nueva cuenta"
        onAction={() => modals.setAccountModal({ account: null })}
      >
        <AccountList
          accounts={accounts}
          onEdit={(account) => modals.setAccountModal({ account })}
          onDelete={(item) => modals.setDeleteTarget({ kind: 'account', item })}
        />
      </DashboardSection>

      <DashboardSection
        title="Sobres de presupuesto"
        actionLabel="+ Nuevo sobre"
        onAction={() => modals.setCategoryModal({ category: null })}
      >
        <CategoryList
          categories={categories}
          onEdit={(category) => modals.setCategoryModal({ category })}
          onDelete={(item) => modals.setDeleteTarget({ kind: 'category', item })}
        />
      </DashboardSection>

      <DashboardSection
        title="Historial de movimientos"
        actionLabel="+ Nueva transacción"
        onAction={() => modals.setTransactionModalOpen(true)}
      >
        <TransactionHistory transactions={transactions} accounts={accounts} categories={categories} />
      </DashboardSection>
    </>
  )
}
