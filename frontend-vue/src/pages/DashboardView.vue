<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '../auth/useAuth'
import AccountFormModal from '../components/AccountFormModal.vue'
import AccountList from '../components/AccountList.vue'
import Alert from '../components/Alert.vue'
import CategoryFormModal from '../components/CategoryFormModal.vue'
import CategoryList from '../components/CategoryList.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import Spinner from '../components/Spinner.vue'
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

const router = useRouter()
const { logout } = useAuth()

const accounts = ref<Account[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const loadError = ref<string | null>(null)

const accountModalOpen = ref(false)
const editingAccount = ref<Account | null>(null)
const categoryModalOpen = ref(false)
const editingCategory = ref<Category | null>(null)

type DeleteTarget =
  | { kind: 'account'; account: Account }
  | { kind: 'category'; category: Category }
const deleteTarget = ref<DeleteTarget | null>(null)
const deleting = ref(false)

async function loadData() {
  loading.value = true
  loadError.value = null
  try {
    const [accountsData, categoriesData] = await Promise.all([getAccounts(), getCategories()])
    accounts.value = accountsData
    categories.value = categoriesData
  } catch (err) {
    loadError.value = extractErrorMessage(err, 'No se pudieron cargar tus datos financieros.')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function handleLogout() {
  logout()
  router.replace('/login')
}

function openCreateAccount() {
  editingAccount.value = null
  accountModalOpen.value = true
}

function openEditAccount(account: Account) {
  editingAccount.value = account
  accountModalOpen.value = true
}

function closeAccountModal() {
  accountModalOpen.value = false
  editingAccount.value = null
}

async function handleAccountSubmit(values: {
  name: string
  type: AccountType
  initial_balance: number
}) {
  if (editingAccount.value) {
    await updateAccount(editingAccount.value.id, { name: values.name, type: values.type })
  } else {
    await createAccount(values)
  }
  closeAccountModal()
  await loadData()
}

function openCreateCategory() {
  editingCategory.value = null
  categoryModalOpen.value = true
}

function openEditCategory(category: Category) {
  editingCategory.value = category
  categoryModalOpen.value = true
}

function closeCategoryModal() {
  categoryModalOpen.value = false
  editingCategory.value = null
}

async function handleCategorySubmit(values: {
  name: string
  target_amount: number
  color: string
  icon: string
}) {
  if (editingCategory.value) {
    await updateCategory(editingCategory.value.id, values)
  } else {
    await createCategory(values)
  }
  closeCategoryModal()
  await loadData()
}

function askDeleteAccount(account: Account) {
  deleteTarget.value = { kind: 'account', account }
}

function askDeleteCategory(category: Category) {
  deleteTarget.value = { kind: 'category', category }
}

async function handleConfirmDelete() {
  const target = deleteTarget.value
  if (!target) return

  deleting.value = true
  try {
    if (target.kind === 'account') {
      await deleteAccount(target.account.id)
    } else {
      await deleteCategory(target.category.id)
    }
    deleteTarget.value = null
    await loadData()
  } catch (err) {
    loadError.value = extractErrorMessage(err, 'No se pudo eliminar el registro.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-100 pb-16">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
          >
            P
          </div>
          <span class="font-semibold text-slate-900">Pulse</span>
        </div>
        <button
          type="button"
          class="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          @click="handleLogout"
        >
          Cerrar sesión
        </button>
      </div>
    </header>

    <section class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Panel financiero</h1>
      <p class="mt-1 text-sm text-slate-500">Gestioná tus cuentas y sobres de presupuesto.</p>

      <div v-if="loadError" class="mt-6">
        <Alert variant="error">{{ loadError }}</Alert>
      </div>

      <div v-if="loading" class="mt-16 flex justify-center">
        <Spinner svg-class="h-8 w-8 text-indigo-600" />
      </div>

      <template v-else>
        <div class="mt-8">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Cuentas</h2>
            <button
              type="button"
              class="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              @click="openCreateAccount"
            >
              + Nueva cuenta
            </button>
          </div>
          <AccountList
            :accounts="accounts"
            @edit="openEditAccount"
            @remove="askDeleteAccount"
          />
        </div>

        <div class="mt-10">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Sobres de presupuesto</h2>
            <button
              type="button"
              class="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              @click="openCreateCategory"
            >
              + Nuevo sobre
            </button>
          </div>
          <CategoryList
            :categories="categories"
            @edit="openEditCategory"
            @remove="askDeleteCategory"
          />
        </div>
      </template>
    </section>

    <AccountFormModal
      v-if="accountModalOpen"
      :account="editingAccount"
      :on-submit="handleAccountSubmit"
      @close="closeAccountModal"
    />

    <CategoryFormModal
      v-if="categoryModalOpen"
      :category="editingCategory"
      :on-submit="handleCategorySubmit"
      @close="closeCategoryModal"
    />

    <ConfirmDialog
      v-if="deleteTarget"
      :title="deleteTarget.kind === 'account' ? 'Eliminar cuenta' : 'Eliminar sobre'"
      :description="
        deleteTarget.kind === 'account'
          ? `¿Seguro que querés eliminar &quot;${deleteTarget.account.name}&quot;? Esta acción no se puede deshacer.`
          : `¿Seguro que querés eliminar &quot;${deleteTarget.category.name}&quot;? Esta acción no se puede deshacer.`
      "
      :loading="deleting"
      @confirm="handleConfirmDelete"
      @cancel="deleteTarget = null"
    />
  </main>
</template>
