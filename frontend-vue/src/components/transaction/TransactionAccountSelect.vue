<script setup lang="ts">
import { currencyFormatter } from '@shared/format'
import type { Account } from '@shared/types'
import Select from '../Select.vue'

defineProps<{ accounts: Account[]; disabled: boolean; exceedsBalance: boolean }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <Select v-model="model" label="Cuenta" :disabled="disabled">
    <option value="">Seleccioná una cuenta</option>
    <option v-for="account in accounts" :key="account.id" :value="account.id">
      {{ account.name }} — {{ currencyFormatter.format(account.balance) }}
    </option>
  </Select>
  <p v-if="exceedsBalance" class="-mt-2 text-xs text-amber-600">
    El monto supera el saldo disponible de la cuenta.
  </p>
</template>
