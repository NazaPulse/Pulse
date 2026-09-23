import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { AccountFormModal } from '../components/AccountFormModal'
import { AccountList } from '../components/AccountList'
import { Alert } from '../components/Alert'
import { CategoryFormModal } from '../components/CategoryFormModal'
import { CategoryList } from '../components/CategoryList'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Spinner } from '../components/Spinner'
import {
  createAccount,
  createCategory,
  deleteAccount,
  deleteCategory,
  extractErrorMessage,
  getAccounts,
  getCategories,
  updateAccount,
  updateCategory,
} from '../lib/api'
import type { Account, AccountType, Category } from '../lib/types'

type DeleteTarget =
  | { kind: 'account'; account: Account }
  | { kind: 'category'; category: Category }

export function DashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [accountModal, setAccountModal] = useState<{ account?: Account | null } | null>(null)
  const [categoryModal, setCategoryModal] = useState<{ category?: Category | null } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [accountsData, categoriesData] = await Promise.all([
        getAccounts(),
        getCategories(),
      ])
      setAccounts(accountsData)
      setCategories(categoriesData)
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'No se pudieron cargar tus datos financieros.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  async function handleAccountSubmit(values: {
    name: string
    type: AccountType
    initial_balance: number
  }) {
    if (accountModal?.account) {
      await updateAccount(accountModal.account.id, { name: values.name, type: values.type })
    } else {
      await createAccount(values)
    }
    setAccountModal(null)
    await loadData()
  }

  async function handleCategorySubmit(values: {
    name: string
    target_amount: number
    color: string
    icon: string
  }) {
    if (categoryModal?.category) {
      await updateCategory(categoryModal.category.id, values)
    } else {
      await createCategory(values)
    }
    setCategoryModal(null)
    await loadData()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.kind === 'account') {
        await deleteAccount(deleteTarget.account.id)
      } else {
        await deleteCategory(deleteTarget.category.id)
      }
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'No se pudo eliminar el registro.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              P
            </div>
            <span className="font-semibold text-slate-900">Pulse</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Panel financiero
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestioná tus cuentas y sobres de presupuesto.
        </p>

        {loadError ? (
          <div className="mt-6">
            <Alert variant="error">{loadError}</Alert>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-16 flex justify-center">
            <Spinner className="h-8 w-8 text-indigo-600" />
          </div>
        ) : (
          <>
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Cuentas</h2>
                <button
                  type="button"
                  onClick={() => setAccountModal({ account: null })}
                  className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  + Nueva cuenta
                </button>
              </div>
              <AccountList
                accounts={accounts}
                onEdit={(account) => setAccountModal({ account })}
                onDelete={(account) => setDeleteTarget({ kind: 'account', account })}
              />
            </div>

            <div className="mt-10">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Sobres de presupuesto</h2>
                <button
                  type="button"
                  onClick={() => setCategoryModal({ category: null })}
                  className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  + Nuevo sobre
                </button>
              </div>
              <CategoryList
                categories={categories}
                onEdit={(category) => setCategoryModal({ category })}
                onDelete={(category) => setDeleteTarget({ kind: 'category', category })}
              />
            </div>
          </>
        )}
      </section>

      {accountModal ? (
        <AccountFormModal
          account={accountModal.account}
          onClose={() => setAccountModal(null)}
          onSubmit={handleAccountSubmit}
        />
      ) : null}

      {categoryModal ? (
        <CategoryFormModal
          category={categoryModal.category}
          onClose={() => setCategoryModal(null)}
          onSubmit={handleCategorySubmit}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          title={deleteTarget.kind === 'account' ? 'Eliminar cuenta' : 'Eliminar sobre'}
          description={
            deleteTarget.kind === 'account'
              ? `¿Seguro que querés eliminar "${deleteTarget.account.name}"? Esta acción no se puede deshacer.`
              : `¿Seguro que querés eliminar "${deleteTarget.category.name}"? Esta acción no se puede deshacer.`
          }
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </main>
  )
}
