<script setup lang="ts">
import { computed, ref } from 'vue'

import { extractErrorMessage } from '../lib/api'
import type { Account, AccountType } from '../lib/types'
import { isValidName } from '../lib/validation'
import Alert from './Alert.vue'
import Field from './Field.vue'
import Modal from './Modal.vue'
import Select from './Select.vue'
import SubmitButton from './SubmitButton.vue'

const props = defineProps<{
  account?: Account | null
  onSubmit: (values: {
    name: string
    type: AccountType
    initial_balance: number
  }) => Promise<void>
}>()
const emit = defineEmits<{ close: [] }>()

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'bank', label: 'Banco' },
  { value: 'wallet', label: 'Billetera virtual' },
  { value: 'cash', label: 'Efectivo' },
]

const isEditing = computed(() => Boolean(props.account))

const name = ref(props.account?.name ?? '')
const type = ref<AccountType>(props.account?.type ?? 'bank')
const initialBalance = ref(props.account ? String(props.account.initial_balance ?? 0) : '0')
const submitting = ref(false)
const error = ref<string | null>(null)

const parsedBalance = computed(() => Number(initialBalance.value))
const canSubmit = computed(
  () =>
    isValidName(name.value) &&
    !submitting.value &&
    (isEditing.value || Number.isFinite(parsedBalance.value)),
)

async function handleSubmit() {
  if (!canSubmit.value) return

  submitting.value = true
  error.value = null
  try {
    await props.onSubmit({
      name: name.value.trim(),
      type: type.value,
      initial_balance: Number.isFinite(parsedBalance.value) ? parsedBalance.value : 0,
    })
  } catch (err) {
    error.value = extractErrorMessage(err, 'No se pudo guardar la cuenta.')
    submitting.value = false
  }
}
</script>

<template>
  <Modal :title="isEditing ? 'Editar cuenta' : 'Nueva cuenta'" @close="emit('close')">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <Field
        v-model="name"
        label="Nombre"
        name="name"
        placeholder="Cuenta Corriente Santander"
        :disabled="submitting"
        :maxlength="100"
        required
      />

      <Select label="Tipo de cuenta" v-model="type" :disabled="submitting">
        <option v-for="option in ACCOUNT_TYPES" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </Select>

      <Field
        v-if="!isEditing"
        v-model="initialBalance"
        label="Saldo inicial"
        type="number"
        step="0.01"
        name="initial_balance"
        placeholder="0"
        :disabled="submitting"
        hint="Se usa como base para calcular el saldo de la cuenta."
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
        <div class="sm:w-40">
          <SubmitButton :loading="submitting" :disabled="!canSubmit" loading-label="Guardando…">
            {{ isEditing ? 'Guardar cambios' : 'Crear cuenta' }}
          </SubmitButton>
        </div>
      </div>
    </form>
  </Modal>
</template>
