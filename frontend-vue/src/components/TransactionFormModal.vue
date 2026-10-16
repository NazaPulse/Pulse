<script setup lang="ts">
import { useTransactionForm } from '../composables/useTransactionForm'
import type { Account, Category, CreateTransactionDTO } from '@shared/types'
import { amountError, DESCRIPTION_MAX_LENGTH } from '@shared/utils/transactionForm'
import Alert from './Alert.vue'
import Field from './Field.vue'
import FormActions from './FormActions.vue'
import Modal from './Modal.vue'
import TransactionAccountSelect from './transaction/TransactionAccountSelect.vue'
import TransactionCategorySelect from './transaction/TransactionCategorySelect.vue'
import TransactionTypeToggle from './transaction/TransactionTypeToggle.vue'

const props = defineProps<{
  accounts: Account[]
  categories: Category[]
  onSubmit: (values: CreateTransactionDTO) => Promise<void>
}>()
const emit = defineEmits<{ close: [] }>()

const { values, submitting, error, canSubmit, exceedsBalance, handleSubmit } =
  useTransactionForm(props)
</script>

<template>
  <Modal title="Nueva transacción" @close="emit('close')">
    <p v-if="accounts.length === 0" class="text-sm text-slate-600">
      Necesitás al menos una cuenta para registrar movimientos. Creá una desde la sección Cuentas.
    </p>

    <form v-else class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <TransactionTypeToggle v-model="values.type" :disabled="submitting" />

      <Field
        v-model="values.amount"
        label="Monto"
        type="number"
        inputmode="decimal"
        step="0.01"
        min="0.01"
        name="amount"
        placeholder="0,00"
        :disabled="submitting"
        :error="amountError(values.amount)"
        required
      />

      <TransactionAccountSelect
        v-model="values.accountId"
        :accounts="accounts"
        :disabled="submitting"
        :exceeds-balance="exceedsBalance"
      />

      <TransactionCategorySelect
        v-model="values.categoryId"
        :categories="categories"
        :disabled="submitting"
        :is-expense="values.type === 'expense'"
      />

      <Field
        v-model="values.date"
        label="Fecha"
        type="date"
        name="date"
        :disabled="submitting"
        required
      />

      <Field
        v-model="values.description"
        label="Descripción (opcional)"
        name="description"
        placeholder="Compra semanal"
        :disabled="submitting"
        :maxlength="DESCRIPTION_MAX_LENGTH"
      />

      <FormActions
        :submitting="submitting"
        :can-submit="canSubmit"
        loading-label="Registrando…"
        submit-width-class="sm:w-44"
        @cancel="emit('close')"
      >
        Registrar
      </FormActions>
    </form>
  </Modal>
</template>
