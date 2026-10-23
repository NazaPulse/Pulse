<script setup lang="ts">
import Alert from './Alert.vue'
import FormActions from './FormActions.vue'
import Modal from './Modal.vue'

/** Modal con formulario: aviso de error, campos (slot) y pie "Cancelar" + envío. */
withDefaults(
  defineProps<{
    title: string
    error: string | null
    submitting: boolean
    canSubmit: boolean
    submitLabel: string
    loadingLabel?: string
    submitWidthClass?: string
  }>(),
  { loadingLabel: 'Guardando…', submitWidthClass: undefined },
)
const emit = defineEmits<{ close: []; submit: [] }>()
</script>

<template>
  <Modal :title="title" @close="emit('close')">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="emit('submit')">
      <Alert v-if="error" variant="error">{{ error }}</Alert>
      <slot />
      <FormActions
        :submitting="submitting"
        :can-submit="canSubmit"
        :loading-label="loadingLabel"
        :submit-width-class="submitWidthClass"
        @cancel="emit('close')"
      >
        {{ submitLabel }}
      </FormActions>
    </form>
  </Modal>
</template>
