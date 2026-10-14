import { useState } from 'react'

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

type Reload = () => Promise<void>

function useAccountModal(reload: Reload) {
  const [accountModal, setAccountModal] = useState<{ account: Account | null } | null>(null)

  async function submitAccount(values: AccountCreateRequest) {
    const editing = accountModal?.account
    if (editing) await updateAccount(editing.id, { name: values.name, type: values.type })
    else await createAccount(values)
    setAccountModal(null)
    await reload()
  }

  return { accountModal, setAccountModal, submitAccount }
}

function useCategoryModal(reload: Reload) {
  const [categoryModal, setCategoryModal] = useState<{ category: Category | null } | null>(null)

  async function submitCategory(values: CategoryUpdateRequest) {
    const editing = categoryModal?.category
    if (editing) await updateCategory(editing.id, values)
    else await createCategory(values)
    setCategoryModal(null)
    await reload()
  }

  return { categoryModal, setCategoryModal, submitCategory }
}

function useTransactionModal(reload: Reload) {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)

  async function submitTransaction(values: CreateTransactionDTO) {
    await createTransaction(values)
    setTransactionModalOpen(false)
    await reload()
  }

  return { transactionModalOpen, setTransactionModalOpen, submitTransaction }
}

function useDeleteConfirm({ reload, onError }: DashboardModalsOptions) {
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await removeTarget(deleteTarget)
      setDeleteTarget(null)
      await reload()
    } catch (err) {
      onError(extractErrorMessage(err, 'No se pudo eliminar el registro.'))
    } finally {
      setDeleting(false)
    }
  }

  return { deleteTarget, setDeleteTarget, deleting, confirmDelete }
}

export function useDashboardModals(options: DashboardModalsOptions) {
  return {
    ...useAccountModal(options.reload),
    ...useCategoryModal(options.reload),
    ...useTransactionModal(options.reload),
    ...useDeleteConfirm(options),
  }
}

export type DashboardModalsState = ReturnType<typeof useDashboardModals>
