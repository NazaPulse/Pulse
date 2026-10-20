<script setup lang="ts">
import Modal from './Modal.vue'
import Spinner from './Spinner.vue'

withDefaults(
  defineProps<{
    title: string
    description: string
    confirmLabel?: string
    loading: boolean
  }>(),
  { confirmLabel: 'Eliminar' },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <Modal :title="title" @close="emit('cancel')">
    <p class="text-sm text-fg-soft">{{ description }}</p>
    <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        :disabled="loading"
        class="rounded-lg border border-line-strong bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-fg-soft transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="loading"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-danger-strong focus:outline-none focus:ring-2 focus:ring-danger-soft/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-danger/40 sm:w-36"
        @click="emit('confirm')"
      >
        <template v-if="loading">
          <Spinner svg-class="h-4 w-4" />
          Eliminando…
        </template>
        <template v-else>{{ confirmLabel }}</template>
      </button>
    </div>
  </Modal>
</template>
