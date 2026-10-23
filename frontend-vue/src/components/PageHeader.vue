<script setup lang="ts">
/** Cabecera de cada sección: etiqueta técnica, título grande y línea de luz. */
defineProps<{ eyebrow: string; title: string; subtitle?: string }>()
</script>

<template>
  <header class="animate-rise">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">{{ title }}</h1>
        <p v-if="subtitle" class="mt-2 max-w-2xl text-sm text-fg-muted">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </div>
    <div class="mt-6 h-px bg-gradient-to-r from-accent/60 via-line-strong to-transparent" />
  </header>
</template>
