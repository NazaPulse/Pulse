<script setup lang="ts">
defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-canvas/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
  >
    <button
      type="button"
      aria-label="Cerrar"
      class="absolute inset-0 cursor-default"
      @click="emit('close')"
    />
    <div
      class="pulse-card hud-corners relative z-10 max-h-[92vh] w-full animate-rise overflow-y-auto overflow-x-hidden rounded-b-none rounded-t-2xl bg-surface p-5 shadow-2xl sm:max-w-md sm:rounded-2xl sm:p-6"
    >
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-fg">{{ title }}</h2>
        <button
          type="button"
          aria-label="Cerrar"
          class="rounded-lg p-1.5 text-fg-dim transition hover:bg-white/10 hover:text-fg"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
      <slot />
    </div>
  </div>
</template>
