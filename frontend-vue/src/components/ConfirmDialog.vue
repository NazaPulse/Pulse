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
    <p class="text-sm text-slate-600">{{ description }}</p>
    <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        :disabled="loading"
        class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="loading"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-36"
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
