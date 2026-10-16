<script setup lang="ts">
import type { DashboardModalsState } from '../../composables/useDashboardModals'
import type { FinanceData } from '../../composables/useFinanceData'
import { deleteDialogDescription, deleteDialogTitle } from '@shared/utils/deleteTarget'
import AccountFormModal from '../AccountFormModal.vue'
import CategoryFormModal from '../CategoryFormModal.vue'
import ConfirmDialog from '../ConfirmDialog.vue'
import TransactionFormModal from '../TransactionFormModal.vue'

defineProps<{ data: FinanceData; modals: DashboardModalsState }>()
</script>

<template>
  <AccountFormModal
    v-if="modals.accountModalOpen"
    :account="modals.editingAccount"
    :on-submit="modals.submitAccount"
    @close="modals.closeAccountModal"
  />

  <CategoryFormModal
    v-if="modals.categoryModalOpen"
    :category="modals.editingCategory"
    :on-submit="modals.submitCategory"
    @close="modals.closeCategoryModal"
  />

  <TransactionFormModal
    v-if="modals.transactionModalOpen"
    :accounts="data.accounts"
    :categories="data.categories"
    :on-submit="modals.submitTransaction"
    @close="modals.setTransactionModalOpen(false)"
  />

  <ConfirmDialog
    v-if="modals.deleteTarget"
    :title="deleteDialogTitle(modals.deleteTarget)"
    :description="deleteDialogDescription(modals.deleteTarget)"
    :loading="modals.deleting"
    @confirm="modals.confirmDelete"
    @cancel="modals.setDeleteTarget(null)"
  />
</template>
