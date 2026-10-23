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

export function useDashboardModals({ reload, onError }: DashboardModalsOptions) {
  const accountModalOpen = ref(false)
  const editingAccount = ref<Account | null>(null)
  const categoryModalOpen = ref(false)
  const editingCategory = ref<Category | null>(null)
  const transactionModalOpen = ref(false)
  const confirmDelete = useConfirmDelete<DeleteTarget>({
    remove: (target) => removeTarget(api, target),
    onRemoved: reload,
    onError,
    errorMessage: DELETE_ERROR,
  })

  function closeAccountModal() {
    accountModalOpen.value = false
    editingAccount.value = null
  }

  function closeCategoryModal() {
    categoryModalOpen.value = false
    editingCategory.value = null
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
    transactionModalOpen,
    setTransactionModalOpen(open: boolean) {
      transactionModalOpen.value = open
    },
    async submitTransaction(values: CreateTransactionDTO) {
      await api.createTransaction(values)
      transactionModalOpen.value = false
      await reload()
    },
    deleteTarget: confirmDelete.target,
    setDeleteTarget: confirmDelete.setTarget,
    deleting: confirmDelete.deleting,
    confirmDelete: confirmDelete.confirm,
  }
}

// Forma que reciben los subcomponentes: el composable envuelto en `reactive()`.
export type DashboardModalsState = UnwrapNestedRefs<ReturnType<typeof useDashboardModals>>
