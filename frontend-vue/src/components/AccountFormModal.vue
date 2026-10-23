<script setup lang="ts">
import { useAccountForm } from '../composables/useAccountForm'
import type { Account, AccountCreateRequest } from '@shared/types'
import { ACCOUNT_TYPES } from '@shared/utils/accountForm'
import Field from './Field.vue'
import FormModal from './FormModal.vue'
import Select from './Select.vue'

const props = defineProps<{
  account?: Account | null
  onSubmit: (values: AccountCreateRequest) => Promise<void>
}>()
const emit = defineEmits<{ close: [] }>()

const { values, isEditing, submitting, error, canSubmit, handleSubmit } = useAccountForm(props)
</script>

<template>
  <FormModal
    :title="isEditing ? 'Editar cuenta' : 'Nueva cuenta'"
    :submit-label="isEditing ? 'Guardar cambios' : 'Crear cuenta'"
    :error="error"
    :submitting="submitting"
    :can-submit="canSubmit"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <Field
      v-model="values.name"
      label="Nombre"
      name="name"
      placeholder="Cuenta Corriente Santander"
      :disabled="submitting"
      :maxlength="100"
      required
    />

    <Select v-model="values.type" label="Tipo de cuenta" :disabled="submitting">
      <option v-for="option in ACCOUNT_TYPES" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </Select>

    <Field
      v-if="!isEditing"
      v-model="values.initialBalance"
      label="Saldo inicial"
      type="number"
      step="0.01"
      name="initial_balance"
      placeholder="0"
      :disabled="submitting"
      hint="Se usa como base para calcular el saldo de la cuenta."
    />
  </FormModal>
</template>
