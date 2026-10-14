<script setup lang="ts">
defineProps<{ title: string; actionLabel: string }>()
const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="mt-10">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
      <button
        type="button"
        class="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
    <slot />
  </div>
</template>
