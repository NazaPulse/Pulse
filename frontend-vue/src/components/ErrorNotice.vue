<script setup lang="ts">
import Alert from './Alert.vue'

/** Mensaje de error de pantalla (no renderiza nada si no hay error). */
defineProps<{ message: string | null }>()
</script>

<template>
  <div v-if="message" class="mt-6">
    <Alert variant="error">{{ message }}</Alert>
  </div>
</template>
