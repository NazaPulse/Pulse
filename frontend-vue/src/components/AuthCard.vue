<script setup lang="ts">
defineProps<{ title: string; subtitle: string }>()
</script>

<template>
  <main
    class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 sm:px-6"
  >
    <div class="w-full max-w-md">
      <div class="mb-6 text-center">
        <div
          class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white"
        >
          P
        </div>
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
          {{ title }}
        </h1>
        <p class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
      </div>

      <div
        class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <slot />
      </div>

      <p
        v-if="$slots.footer"
        class="mt-6 text-center text-sm text-slate-500"
      >
        <slot name="footer" />
      </p>
    </div>
  </main>
</template>
