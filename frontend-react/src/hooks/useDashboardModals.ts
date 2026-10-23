import { useState } from 'react'

import { DELETE_ERROR, removeTarget, saveAccount, saveCategory } from '@shared/financeActions'
import type { Account, AccountCreateRequest, Category, CategoryUpdateRequest, CreateTransactionDTO } from '@shared/types'
import type { DeleteTarget } from '@shared/utils/deleteTarget'
import { api } from '../lib/api'
import { useConfirmDelete } from './useConfirmDelete'

interface DashboardModalsOptions {
  reload: () => Promise<void>
  onError: (message: string) => void
}

export function useDashboardModals({ reload, onError }: DashboardModalsOptions) {
  const [accountModal, setAccountModal] = useState<{ account: Account | null } | null>(null)
  const [categoryModal, setCategoryModal] = useState<{ category: Category | null } | null>(null)
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const confirmDelete = useConfirmDelete<DeleteTarget>({
    remove: (target) => removeTarget(api, target),
    onRemoved: reload,
    onError,
    errorMessage: DELETE_ERROR,
  })

  async function finish(close: () => void) {
    close()
    await reload()
  }

  return {
    accountModal,
    setAccountModal,
    submitAccount: async (values: AccountCreateRequest) => {
      await saveAccount(api, accountModal?.account, values)
      await finish(() => setAccountModal(null))
    },
    categoryModal,
    setCategoryModal,
    submitCategory: async (values: CategoryUpdateRequest) => {
      await saveCategory(api, categoryModal?.category, values)
      await finish(() => setCategoryModal(null))
    },
    transactionModalOpen,
    setTransactionModalOpen,
    submitTransaction: async (values: CreateTransactionDTO) => {
      await api.createTransaction(values)
      await finish(() => setTransactionModalOpen(false))
    },
    deleteTarget: confirmDelete.target,
    setDeleteTarget: confirmDelete.setTarget,
    deleting: confirmDelete.deleting,
    confirmDelete: confirmDelete.confirm,
  }
}

export type DashboardModalsState = ReturnType<typeof useDashboardModals>
