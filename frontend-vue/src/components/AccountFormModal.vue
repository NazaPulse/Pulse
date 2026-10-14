<script setup lang="ts">
import { useAccountForm } from '../composables/useAccountForm'
import type { Account, AccountCreateRequest } from '@shared/types'
import { ACCOUNT_TYPES } from '@shared/utils/accountForm'
import Alert from './Alert.vue'
import Field from './Field.vue'
import FormActions from './FormActions.vue'
import Modal from './Modal.vue'
import Select from './Select.vue'

const props = defineProps<{
  account?: Account | null
  onSubmit: (values: AccountCreateRequest) => Promise<void>
}>()
const emit = defineEmits<{ close: [] }>()

const { values, isEditing, submitting, error, canSubmit, handleSubmit } = useAccountForm(props)
</script>

<template>
  <Modal :title="isEditing ? 'Editar cuenta' : 'Nueva cuenta'" @close="emit('close')">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <Field
        v-model="values.name"
        label="Nombre"
        name="name"
        placeholder="Cuenta Corriente Santander"
        :disabled="submitting"
        :maxlength="100"
        required
      />

      <Select label="Tipo de cuenta" v-model="values.type" :disabled="submitting">
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

      <FormActions
        :submitting="submitting"
        :can-submit="canSubmit"
        loading-label="Guardando…"
        @cancel="emit('close')"
      >
        {{ isEditing ? 'Guardar cambios' : 'Crear cuenta' }}
      </FormActions>
    </form>
  </Modal>
</template>
