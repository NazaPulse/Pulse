import { ref } from 'vue'
import type { UnwrapNestedRefs } from 'vue'

import {
  createAccount,
  createCategory,
  createTransaction,
  deleteAccount,
  deleteCategory,
  extractErrorMessage,
  updateAccount,
  updateCategory,
} from '../lib/api'
import type {
  Account,
  AccountCreateRequest,
  Category,
  CategoryUpdateRequest,
  CreateTransactionDTO,
} from '@shared/types'
import type { DeleteTarget } from '@shared/utils/deleteTarget'

interface DashboardModalsOptions {
  reload: () => Promise<void>
  onError: (message: string) => void
}

function removeTarget(target: DeleteTarget): Promise<void> {
  return target.kind === 'account' ? deleteAccount(target.item.id) : deleteCategory(target.item.id)
}

function useAccountModal(reload: () => Promise<void>) {
  const accountModalOpen = ref(false)
  const editingAccount = ref<Account | null>(null)

  function openAccountModal(account: Account | null = null) {
    editingAccount.value = account
    accountModalOpen.value = true
  }

  function closeAccountModal() {
    accountModalOpen.value = false
    editingAccount.value = null
  }

  async function submitAccount(values: AccountCreateRequest) {
    const editing = editingAccount.value
    if (editing) await updateAccount(editing.id, { name: values.name, type: values.type })
    else await createAccount(values)
    closeAccountModal()
    await reload()
  }

  return { accountModalOpen, editingAccount, openAccountModal, closeAccountModal, submitAccount }
}

function useCategoryModal(reload: () => Promise<void>) {
  const categoryModalOpen = ref(false)
  const editingCategory = ref<Category | null>(null)

  function openCategoryModal(category: Category | null = null) {
    editingCategory.value = category
    categoryModalOpen.value = true
  }

  function closeCategoryModal() {
    categoryModalOpen.value = false
    editingCategory.value = null
  }

  async function submitCategory(values: CategoryUpdateRequest) {
    const editing = editingCategory.value
    if (editing) await updateCategory(editing.id, values)
    else await createCategory(values)
    closeCategoryModal()
    await reload()
  }

  return { categoryModalOpen, editingCategory, openCategoryModal, closeCategoryModal, submitCategory }
}

function useTransactionModal(reload: () => Promise<void>) {
  const transactionModalOpen = ref(false)

  function setTransactionModalOpen(open: boolean) {
    transactionModalOpen.value = open
  }

  async function submitTransaction(values: CreateTransactionDTO) {
    await createTransaction(values)
    transactionModalOpen.value = false
    await reload()
  }

  return { transactionModalOpen, setTransactionModalOpen, submitTransaction }
}

function useDeleteConfirm({ reload, onError }: DashboardModalsOptions) {
  const deleteTarget = ref<DeleteTarget | null>(null)
  const deleting = ref(false)

  function setDeleteTarget(target: DeleteTarget | null) {
    deleteTarget.value = target
  }

  async function confirmDelete() {
    const target = deleteTarget.value
    if (!target) return
    deleting.value = true
    try {
      await removeTarget(target)
      deleteTarget.value = null
      await reload()
    } catch (err) {
      onError(extractErrorMessage(err, 'No se pudo eliminar el registro.'))
    } finally {
      deleting.value = false
    }
  }

  return { deleteTarget, deleting, setDeleteTarget, confirmDelete }
}

export function useDashboardModals(options: DashboardModalsOptions) {
  return {
    ...useAccountModal(options.reload),
    ...useCategoryModal(options.reload),
    ...useTransactionModal(options.reload),
    ...useDeleteConfirm(options),
  }
}

// Forma que reciben los subcomponentes: el composable envuelto en `reactive()`.
export type DashboardModalsState = UnwrapNestedRefs<ReturnType<typeof useDashboardModals>>
