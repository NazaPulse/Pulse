<script setup lang="ts">
import { computed } from 'vue'

import { useCategoryForm } from '../composables/useCategoryForm'
import type { Category, CategoryUpdateRequest } from '@shared/types'
import { ICON_OPTIONS } from '@shared/utils/categoryForm'
import Alert from './Alert.vue'
import CategoryColorField from './category/CategoryColorField.vue'
import Field from './Field.vue'
import FormActions from './FormActions.vue'
import Modal from './Modal.vue'
import Select from './Select.vue'

const props = defineProps<{
  category?: Category | null
  onSubmit: (values: CategoryUpdateRequest) => Promise<void>
}>()
const emit = defineEmits<{ close: [] }>()

const isEditing = computed(() => Boolean(props.category))
const { values, submitting, error, canSubmit, handleSubmit } = useCategoryForm(props)
</script>

<template>
  <Modal :title="isEditing ? 'Editar sobre' : 'Nuevo sobre'" @close="emit('close')">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <Field
        v-model="values.name"
        label="Nombre"
        name="name"
        placeholder="Supermercado"
        :disabled="submitting"
        :maxlength="100"
        required
      />

      <Field
        v-model="values.targetAmount"
        label="Monto objetivo"
        type="number"
        step="0.01"
        min="0"
        name="target_amount"
        placeholder="500"
        :disabled="submitting"
        required
      />

      <CategoryColorField v-model="values.color" :disabled="submitting" />

      <Select v-model="values.icon" label="Ícono" :disabled="submitting">
        <option v-for="option in ICON_OPTIONS" :key="option" :value="option">
          {{ option }}
        </option>
      </Select>

      <FormActions
        :submitting="submitting"
        :can-submit="canSubmit"
        loading-label="Guardando…"
        @cancel="emit('close')"
      >
        {{ isEditing ? 'Guardar cambios' : 'Crear sobre' }}
      </FormActions>
    </form>
  </Modal>
</template>
