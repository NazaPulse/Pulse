<script setup lang="ts">
import type { Account, AccountType } from '../lib/types'

defineProps<{ accounts: Account[] }>()
const emit = defineEmits<{ edit: [account: Account]; remove: [account: Account] }>()

const TYPE_LABEL: Record<AccountType, string> = {
  bank: 'Banco',
  wallet: 'Billetera virtual',
  cash: 'Efectivo',
}

const TYPE_ICON: Record<AccountType, string> = {
  bank: '🏦',
  wallet: '📱',
  cash: '💵',
}

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
})

function format(value: number): string {
  return currencyFormatter.format(value)
}
</script>

<template>
  <p
    v-if="accounts.length === 0"
    class="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500"
  >
    Todavía no tenés cuentas cargadas. Creá la primera con el botón de arriba.
  </p>

  <ul v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <li
      v-for="account in accounts"
      :key="account.id"
      class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg"
        >
          {{ TYPE_ICON[account.type] }}
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-900">{{ account.name }}</p>
          <p class="text-xs text-slate-500">{{ TYPE_LABEL[account.type] }}</p>
          <p class="mt-0.5 text-base font-semibold text-slate-900">
            {{ format(account.balance) }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          :aria-label="`Editar ${account.name}`"
          class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
          @click="emit('edit', account)"
        >
          <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path
              d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          :aria-label="`Eliminar ${account.name}`"
          class="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          @click="emit('remove', account)"
        >
          <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path
              d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.7 12.1A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-2-1.9L7 7"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </li>
  </ul>
</template>
