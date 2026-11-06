import { useState } from 'react'

import { DELETE_ERROR, removeTarget, saveAccount, saveCategory } from '@shared/financeActions'
import type {
  Account,
  AccountCreateRequest,
  Category,
  CategoryUpdateRequest,
  CreateTransactionDTO,
} from '@shared/types'
import type { DeleteTarget } from '@shared/utils/deleteTarget'
import { api } from '../lib/api'
import { useConfirmDelete } from './useConfirmDelete'

interface DashboardModalsOptions {
  reload: () => Promise<void>
  onError: (message: string) => void
}

type Finish = (close: () => void) => Promise<void>

function useAccountModal(finish: Finish) {
  const [accountModal, setAccountModal] = useState<{ account: Account | null } | null>(null)
  return {
    accountModal,
    setAccountModal,
    submitAccount: async (values: AccountCreateRequest) => {
      await saveAccount(api, accountModal?.account, values)
      await finish(() => setAccountModal(null))
    },
  }
}

function useCategoryModal(finish: Finish) {
  const [categoryModal, setCategoryModal] = useState<{ category: Category | null } | null>(null)
  return {
    categoryModal,
    setCategoryModal,
    submitCategory: async (values: CategoryUpdateRequest) => {
      await saveCategory(api, categoryModal?.category, values)
      await finish(() => setCategoryModal(null))
    },
  }
}

function useTransactionModal(finish: Finish) {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  return {
    transactionModalOpen,
    setTransactionModalOpen,
    submitTransaction: async (values: CreateTransactionDTO) => {
      await api.createTransaction(values)
      await finish(() => setTransactionModalOpen(false))
    },
  }
}

export function useDashboardModals({ reload, onError }: DashboardModalsOptions) {
  async function finish(close: () => void) {
    close()
    await reload()
  }
  const accounts = useAccountModal(finish)
  const categories = useCategoryModal(finish)
  const transactions = useTransactionModal(finish)
  const confirmDelete = useConfirmDelete<DeleteTarget>({
    remove: (target) => removeTarget(api, target),
    onRemoved: reload,
    onError,
    errorMessage: DELETE_ERROR,
  })

  return {
    ...accounts,
    ...categories,
    ...transactions,
    deleteTarget: confirmDelete.target,
    setDeleteTarget: confirmDelete.setTarget,
    deleting: confirmDelete.deleting,
    confirmDelete: confirmDelete.confirm,
  }
}

export type DashboardModalsState = ReturnType<typeof useDashboardModals>
