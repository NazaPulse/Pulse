<script setup lang="ts">
import { computed, ref } from 'vue'

import { extractErrorMessage } from '../lib/api'
import { currencyFormatter } from '../lib/format'
import type { Account, Category, CreateTransactionDTO, TransactionType } from '../lib/types'
import Alert from './Alert.vue'
import Field from './Field.vue'
import Modal from './Modal.vue'
import Select from './Select.vue'
import SubmitButton from './SubmitButton.vue'

const DESCRIPTION_MAX_LENGTH = 255

const TYPE_OPTIONS: { value: TransactionType; label: string; active: string }[] = [
  { value: 'income', label: 'Ingreso', active: 'bg-emerald-600 text-white shadow-sm' },
  { value: 'expense', label: 'Egreso', active: 'bg-red-600 text-white shadow-sm' },
]

/** Fecha local de hoy en formato `YYYY-MM-DD` (valor de `<input type="date">`). */
function todayLocal(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

const props = defineProps<{
  accounts: Account[]
  categories: Category[]
  onSubmit: (values: CreateTransactionDTO) => Promise<void>
}>()
const emit = defineEmits<{ close: [] }>()

const type = ref<TransactionType>('expense')
const amount = ref('')
const accountId = ref(props.accounts.length === 1 ? props.accounts[0].id : '')
const categoryId = ref('')
const date = ref(todayLocal())
const description = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

const parsedAmount = computed(() => Number(amount.value))
const amountValid = computed(
  () => amount.value.trim() !== '' && Number.isFinite(parsedAmount.value) && parsedAmount.value > 0,
)
const isExpense = computed(() => type.value === 'expense')
const selectedAccount = computed(
  () => props.accounts.find((a) => a.id === accountId.value) ?? null,
)
const exceedsBalance = computed(
  () =>
    isExpense.value &&
    selectedAccount.value !== null &&
    amountValid.value &&
    parsedAmount.value > selectedAccount.value.balance,
)

const canSubmit = computed(
  () =>
    amountValid.value &&
    Boolean(accountId.value) &&
    (!isExpense.value || Boolean(categoryId.value)) &&
    Boolean(date.value) &&
    description.value.length <= DESCRIPTION_MAX_LENGTH &&
    !submitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return

  submitting.value = true
  error.value = null
  try {
    const payload: CreateTransactionDTO = {
      amount: parsedAmount.value,
      type: type.value,
      account_id: accountId.value,
      // Mediodía local para que la fecha no cambie de día al pasar a UTC.
      date: new Date(`${date.value}T12:00:00`).toISOString(),
    }
    if (categoryId.value) payload.category_id = categoryId.value
    const trimmed = description.value.trim()
    if (trimmed) payload.description = trimmed

    await props.onSubmit(payload)
  } catch (err) {
    error.value = extractErrorMessage(err, 'No se pudo registrar la transacción.')
    submitting.value = false
  }
}
</script>

<template>
  <Modal title="Nueva transacción" @close="emit('close')">
    <p v-if="accounts.length === 0" class="text-sm text-slate-600">
      Necesitás al menos una cuenta para registrar movimientos. Creá una desde la sección Cuentas.
    </p>

    <form v-else class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-slate-700">Tipo</span>
        <div class="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="radiogroup">
          <button
            v-for="option in TYPE_OPTIONS"
            :key="option.value"
            type="button"
            role="radio"
            :aria-checked="type === option.value"
            :disabled="submitting"
            :class="[
              'rounded-md px-3 py-2 text-sm font-semibold transition',
              type === option.value ? option.active : 'text-slate-600 hover:text-slate-900',
            ]"
            @click="type = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <Field
        v-model="amount"
        label="Monto"
        type="number"
        inputmode="decimal"
        step="0.01"
        min="0.01"
        name="amount"
        placeholder="0,00"
        :disabled="submitting"
        :error="amount.trim() !== '' && !amountValid ? 'El monto debe ser mayor a 0.' : undefined"
        required
      />

      <Select v-model="accountId" label="Cuenta" :disabled="submitting">
        <option value="">Seleccioná una cuenta</option>
        <option v-for="account in accounts" :key="account.id" :value="account.id">
          {{ account.name }} — {{ currencyFormatter.format(account.balance) }}
        </option>
      </Select>
      <p v-if="exceedsBalance" class="-mt-2 text-xs text-amber-600">
        El monto supera el saldo disponible de la cuenta.
      </p>

      <Select
        v-model="categoryId"
        :label="isExpense ? 'Sobre' : 'Sobre (opcional)'"
        :disabled="submitting"
      >
        <option value="">{{ isExpense ? 'Seleccioná un sobre' : 'Sin sobre' }}</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </Select>
      <p v-if="isExpense && categories.length === 0" class="-mt-2 text-xs text-amber-600">
        Los egresos requieren un sobre. Creá uno desde la sección Sobres de presupuesto.
      </p>

      <Field
        v-model="date"
        label="Fecha"
        type="date"
        name="date"
        :disabled="submitting"
        required
      />

      <Field
        v-model="description"
        label="Descripción (opcional)"
        name="description"
        placeholder="Compra semanal"
        :disabled="submitting"
        :maxlength="DESCRIPTION_MAX_LENGTH"
      />

      <div class="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          :disabled="submitting"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <div class="sm:w-44">
          <SubmitButton :loading="submitting" :disabled="!canSubmit" loading-label="Registrando…">
            Registrar
          </SubmitButton>
        </div>
      </div>
    </form>
  </Modal>
</template>
