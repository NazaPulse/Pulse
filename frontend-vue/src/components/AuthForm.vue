<script setup lang="ts">
import type { AuthCopy, AuthField, AuthFieldKey } from '@shared/authForms'
import Alert from './Alert.vue'
import Field from './Field.vue'
import SubmitButton from './SubmitButton.vue'

/** Formulario de acceso a partir de la especificación de campos compartida. */
defineProps<{
  fields: AuthField[]
  values: Partial<Record<AuthFieldKey, string>>
  copy: AuthCopy
  /** Muestra el mensaje de éxito sobre el formulario. */
  showSuccess: boolean
  /** Deshabilita los campos (envío en curso o alta ya completada). */
  locked: boolean
  submitting: boolean
  canSubmit: boolean
  error: string | null
}>()
const emit = defineEmits<{ submit: []; 'update:field': [key: AuthFieldKey, value: string] }>()
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="emit('submit')">
    <Alert v-if="showSuccess" variant="success">{{ copy.success }}</Alert>
    <Alert v-if="error" variant="error">{{ error }}</Alert>

    <Field
      v-for="field in fields"
      :key="field.key"
      :model-value="values[field.key] ?? ''"
      :label="field.label"
      :type="field.type"
      :name="field.name"
      :autocomplete="field.autocomplete"
      :placeholder="field.placeholder"
      :disabled="locked"
      :maxlength="field.maxLength"
      :hint="field.hint"
      :error="field.validate?.(values[field.key] ?? '')"
      :required="field.required"
      @update:model-value="(value) => emit('update:field', field.key, value)"
    />

    <SubmitButton :loading="submitting" :disabled="!canSubmit" :loading-label="copy.loading">
      {{ copy.submit }}
    </SubmitButton>
  </form>
</template>
