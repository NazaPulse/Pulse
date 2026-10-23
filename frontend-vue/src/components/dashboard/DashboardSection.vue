<script setup lang="ts">
defineProps<{ title: string; actionLabel: string }>()
const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="mt-12">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="section-title">{{ title }}</h2>
      <button
        type="button"
        class="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-ink shadow-glow transition hover:bg-accent-hover"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
    <slot />
  </div>
</template>
