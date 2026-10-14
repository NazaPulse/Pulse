<script setup lang="ts">
import type { DashboardModalsState } from '../../composables/useDashboardModals'
import type { FinanceData } from '../../composables/useFinanceData'
import AccountList from '../AccountList.vue'
import CategoryList from '../CategoryList.vue'
import FinanceCharts from '../FinanceCharts.vue'
import TransactionHistory from '../TransactionHistory.vue'
import DashboardSection from './DashboardSection.vue'

defineProps<{ data: FinanceData; modals: DashboardModalsState }>()
</script>

<template>
  <div v-if="data.summary" class="mt-8">
    <FinanceCharts :summary="data.summary" />
  </div>

  <DashboardSection
    title="Cuentas"
    action-label="+ Nueva cuenta"
    @action="modals.openAccountModal()"
  >
    <AccountList
      :accounts="data.accounts"
      @edit="modals.openAccountModal"
      @remove="(item) => modals.setDeleteTarget({ kind: 'account', item })"
    />
  </DashboardSection>

  <DashboardSection
    title="Sobres de presupuesto"
    action-label="+ Nuevo sobre"
    @action="modals.openCategoryModal()"
  >
    <CategoryList
      :categories="data.categories"
      @edit="modals.openCategoryModal"
      @remove="(item) => modals.setDeleteTarget({ kind: 'category', item })"
    />
  </DashboardSection>

  <DashboardSection
    title="Historial de movimientos"
    action-label="+ Nueva transacción"
    @action="modals.setTransactionModalOpen(true)"
  >
    <TransactionHistory
      :transactions="data.transactions"
      :accounts="data.accounts"
      :categories="data.categories"
    />
  </DashboardSection>
</template>
