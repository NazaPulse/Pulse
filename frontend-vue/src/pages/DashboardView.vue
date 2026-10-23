<script setup lang="ts">
import { reactive } from 'vue'

import DashboardContent from '../components/dashboard/DashboardContent.vue'
import DashboardModals from '../components/dashboard/DashboardModals.vue'
import ErrorNotice from '../components/ErrorNotice.vue'
import LoadingBlock from '../components/LoadingBlock.vue'
import PageHeader from '../components/PageHeader.vue'
import { useDashboardModals } from '../composables/useDashboardModals'
import { useFinanceData } from '../composables/useFinanceData'

const { data, loading, error, reload } = useFinanceData()
const modals = reactive(
  useDashboardModals({
    reload,
    onError: (message) => {
      error.value = message
    },
  }),
)
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
    <PageHeader
      eyebrow="01 · Finanzas"
      title="Panel financiero"
      subtitle="Tus métricas, cuentas, sobres de presupuesto y movimientos."
    />

    <ErrorNotice :message="error" />

    <LoadingBlock v-if="loading" />
    <DashboardContent v-else :data="data" :modals="modals" />

    <DashboardModals :data="data" :modals="modals" />
  </section>
</template>
