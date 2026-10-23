<script setup lang="ts">
import Spinner from './Spinner.vue'
</script>

<!-- Spinner centrado para la carga inicial de una pantalla. -->
<template>
  <div class="mt-16 flex justify-center">
    <Spinner svg-class="h-8 w-8 text-accent" />
  </div>
</template>
