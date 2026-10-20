<script setup lang="ts">
import { computed } from 'vue'

import { currencyFormatter, formatDate } from '@shared/format'
import type { Account, Category, Transaction } from '@shared/types'

const props = defineProps<{
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
}>()

const accountName = computed(() => new Map(props.accounts.map((a) => [a.id, a.name])))
const categoryName = computed(() => new Map(props.categories.map((c) => [c.id, c.name])))

// El backend ya ordena por fecha desc; se reordena por robustez.
const sorted = computed(() =>
  [...props.transactions].sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  ),
)

function signedAmount(tx: Transaction): string {
  return `${tx.type === 'income' ? '+' : '-'}${currencyFormatter.format(tx.amount)}`
}

function amountClass(tx: Transaction): string {
  return tx.type === 'income' ? 'text-ok' : 'text-danger-soft'
}

function categoryOf(tx: Transaction): string | undefined {
  return tx.category_id ? categoryName.value.get(tx.category_id) : undefined
}

function labelFor(tx: Transaction): string {
  return tx.description || categoryOf(tx) || (tx.type === 'income' ? 'Ingreso' : 'Egreso')
}
</script>

<template>
  <p
    v-if="transactions.length === 0"
    class="pulse-empty px-4 py-6 text-center text-sm text-fg-muted"
  >
    Todavía no registraste movimientos. Usá “+ Nueva transacción” para empezar.
  </p>

  <template v-else>
    <!-- Mobile: tarjetas -->
    <ul class="flex flex-col gap-2 md:hidden">
      <li
        v-for="tx in sorted"
        :key="tx.id"
        class="flex items-center justify-between gap-3 pulse-card p-4"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-fg">{{ labelFor(tx) }}</p>
          <p class="mt-0.5 truncate text-xs text-fg-muted">
            {{ formatDate(tx.date) }} · {{ accountName.get(tx.account_id) ?? 'Cuenta' }}{{
              categoryOf(tx) ? ` · ${categoryOf(tx)}` : ''
            }}
          </p>
        </div>
        <span :class="['shrink-0 text-base font-semibold tabular-nums', amountClass(tx)]">
          {{ signedAmount(tx) }}
        </span>
      </li>
    </ul>

    <!-- Escritorio: tabla -->
    <div
      class="hidden overflow-hidden pulse-card md:block"
    >
      <table class="w-full text-left text-sm">
        <thead
          class="border-b border-line bg-white/5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-fg-muted"
        >
          <tr>
            <th scope="col" class="px-4 py-3 font-medium">Fecha</th>
            <th scope="col" class="px-4 py-3 font-medium">Descripción</th>
            <th scope="col" class="px-4 py-3 font-medium">Tipo</th>
            <th scope="col" class="px-4 py-3 font-medium">Cuenta</th>
            <th scope="col" class="px-4 py-3 font-medium">Sobre</th>
            <th scope="col" class="px-4 py-3 text-right font-medium">Monto</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="tx in sorted" :key="tx.id" class="transition hover:bg-white/5">
            <td class="whitespace-nowrap px-4 py-3 text-fg-soft">{{ formatDate(tx.date) }}</td>
            <td class="max-w-[14rem] truncate px-4 py-3 text-fg">
              {{ tx.description || '—' }}
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  tx.type === 'income'
                    ? 'bg-ok/10 text-ok'
                    : 'bg-danger/10 text-danger-soft',
                ]"
              >
                {{ tx.type === 'income' ? 'Ingreso' : 'Egreso' }}
              </span>
            </td>
            <td class="px-4 py-3 text-fg-soft">{{ accountName.get(tx.account_id) ?? '—' }}</td>
            <td class="px-4 py-3 text-fg-soft">{{ categoryOf(tx) || '—' }}</td>
            <td
              :class="[
                'whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums',
                amountClass(tx),
              ]"
            >
              {{ signedAmount(tx) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>
