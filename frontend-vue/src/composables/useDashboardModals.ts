import { ref } from 'vue'
import type { UnwrapNestedRefs } from 'vue'

import { DELETE_ERROR, removeTarget, saveAccount, saveCategory } from '@shared/financeActions'
import type { Account, AccountCreateRequest, Category, CategoryUpdateRequest, CreateTransactionDTO } from '@shared/types'
import type { DeleteTarget } from '@shared/utils/deleteTarget'
import { api } from '../lib/api'
import { useConfirmDelete } from './useConfirmDelete'

interface DashboardModalsOptions {
  reload: () => Promise<void>
  onError: (message: string) => void
}

type Reload = () => Promise<void>

function useAccountModal(reload: Reload) {
  const accountModalOpen = ref(false)
  const editingAccount = ref<Account | null>(null)
  function closeAccountModal() {
    accountModalOpen.value = false
    editingAccount.value = null
  }
  return {
    accountModalOpen,
    editingAccount,
    openAccountModal(account: Account | null = null) {
      editingAccount.value = account
      accountModalOpen.value = true
    },
    closeAccountModal,
    async submitAccount(values: AccountCreateRequest) {
      await saveAccount(api, editingAccount.value, values)
      closeAccountModal()
      await reload()
    },
  }
}

function useCategoryModal(reload: Reload) {
  const categoryModalOpen = ref(false)
  const editingCategory = ref<Category | null>(null)
  function closeCategoryModal() {
    categoryModalOpen.value = false
    editingCategory.value = null
  }
  return {
    categoryModalOpen,
    editingCategory,
    openCategoryModal(category: Category | null = null) {
      editingCategory.value = category
      categoryModalOpen.value = true
    },
    closeCategoryModal,
    async submitCategory(values: CategoryUpdateRequest) {
      await saveCategory(api, editingCategory.value, values)
      closeCategoryModal()
      await reload()
    },
  }
}

function useTransactionModal(reload: Reload) {
  const transactionModalOpen = ref(false)
  return {
    transactionModalOpen,
    setTransactionModalOpen(open: boolean) {
      transactionModalOpen.value = open
    },
    async submitTransaction(values: CreateTransactionDTO) {
      await api.createTransaction(values)
      transactionModalOpen.value = false
      await reload()
    },
  }
}

export function useDashboardModals({ reload, onError }: DashboardModalsOptions) {
  const accounts = useAccountModal(reload)
  const categories = useCategoryModal(reload)
  const transactions = useTransactionModal(reload)
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

// Forma que reciben los subcomponentes: el composable envuelto en `reactive()`.
export type DashboardModalsState = UnwrapNestedRefs<ReturnType<typeof useDashboardModals>>
