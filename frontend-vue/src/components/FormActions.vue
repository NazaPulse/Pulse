<script setup lang="ts">
import SubmitButton from './SubmitButton.vue'

// Pie común de los formularios en modal: "Cancelar" + botón de envío.
withDefaults(
  defineProps<{
    submitting: boolean
    canSubmit: boolean
    loadingLabel: string
    submitWidthClass?: string
  }>(),
  { submitWidthClass: 'sm:w-40' },
)
const emit = defineEmits<{ cancel: [] }>()
</script>

<template>
  <div class="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <button
      type="button"
      :disabled="submitting"
      class="rounded-lg border border-line-strong bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-fg-soft transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
      @click="emit('cancel')"
    >
      Cancelar
    </button>
    <div :class="submitWidthClass">
      <SubmitButton :loading="submitting" :disabled="!canSubmit" :loading-label="loadingLabel">
        <slot />
      </SubmitButton>
    </div>
  </div>
</template>
