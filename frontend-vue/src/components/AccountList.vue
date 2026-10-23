<script setup lang="ts">
import { currencyFormatter } from '@shared/format'
import type { Account } from '@shared/types'
import { ACCOUNT_TYPE_ICON, ACCOUNT_TYPE_LABEL } from '@shared/utils/accountForm'
import RowActions from './RowActions.vue'

defineProps<{ accounts: Account[] }>()
const emit = defineEmits<{ edit: [account: Account]; remove: [account: Account] }>()
</script>

<template>
  <p v-if="accounts.length === 0" class="pulse-empty px-4 py-6 text-center text-sm text-fg-muted">
    Todavía no tenés cuentas cargadas. Creá la primera con el botón de arriba.
  </p>

  <ul v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <li
      v-for="account in accounts"
      :key="account.id"
      class="flex items-center justify-between gap-3 pulse-card p-4"
    >
      <div class="flex min-w-0 items-center gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg">
          {{ ACCOUNT_TYPE_ICON[account.type] }}
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-fg">{{ account.name }}</p>
          <p class="text-xs text-fg-muted">{{ ACCOUNT_TYPE_LABEL[account.type] }}</p>
          <p class="mt-0.5 text-base font-semibold text-fg">{{ currencyFormatter.format(account.balance) }}</p>
        </div>
      </div>
      <RowActions editable :name="account.name" @edit="emit('edit', account)" @remove="emit('remove', account)" />
    </li>
  </ul>
</template>
