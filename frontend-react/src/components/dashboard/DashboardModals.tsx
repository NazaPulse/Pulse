import type { DashboardModalsState } from '../../hooks/useDashboardModals'
import type { FinanceData } from '../../hooks/useFinanceData'
import { deleteDialogDescription, deleteDialogTitle } from '@shared/utils/deleteTarget'
import { AccountFormModal } from '../AccountFormModal'
import { CategoryFormModal } from '../CategoryFormModal'
import { ConfirmDialog } from '../ConfirmDialog'
import { TransactionFormModal } from '../TransactionFormModal'

interface DashboardModalsProps {
  data: FinanceData
  modals: DashboardModalsState
}

export function DashboardModals({ data, modals }: DashboardModalsProps) {
  const { accountModal, categoryModal, deleteTarget } = modals
  return (
    <>
      {accountModal ? (
        <AccountFormModal
          account={accountModal.account}
          onClose={() => modals.setAccountModal(null)}
          onSubmit={modals.submitAccount}
        />
      ) : null}

      {categoryModal ? (
        <CategoryFormModal
          category={categoryModal.category}
          onClose={() => modals.setCategoryModal(null)}
          onSubmit={modals.submitCategory}
        />
      ) : null}

      {modals.transactionModalOpen ? (
        <TransactionFormModal
          accounts={data.accounts}
          categories={data.categories}
          onClose={() => modals.setTransactionModalOpen(false)}
          onSubmit={modals.submitTransaction}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          title={deleteDialogTitle(deleteTarget)}
          description={deleteDialogDescription(deleteTarget)}
          loading={modals.deleting}
          onConfirm={modals.confirmDelete}
          onCancel={() => modals.setDeleteTarget(null)}
        />
      ) : null}
    </>
  )
}
