<script setup lang="ts">
import { reactive } from 'vue'

import Alert from '../components/Alert.vue'
import DashboardContent from '../components/dashboard/DashboardContent.vue'
import DashboardHeader from '../components/dashboard/DashboardHeader.vue'
import DashboardModals from '../components/dashboard/DashboardModals.vue'
import Spinner from '../components/Spinner.vue'
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
  <main class="min-h-screen bg-slate-100 pb-16">
    <DashboardHeader />

    <section class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Panel financiero</h1>
      <p class="mt-1 text-sm text-slate-500">Tus métricas, cuentas, sobres de presupuesto y movimientos.</p>

      <div v-if="error" class="mt-6">
        <Alert variant="error">{{ error }}</Alert>
      </div>

      <div v-if="loading" class="mt-16 flex justify-center">
        <Spinner svg-class="h-8 w-8 text-indigo-600" />
      </div>

      <DashboardContent v-else :data="data" :modals="modals" />
    </section>

    <DashboardModals :data="data" :modals="modals" />
  </main>
</template>
