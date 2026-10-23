<script setup lang="ts">
import IconButton from './IconButton.vue'

/** Editar (opcional) + eliminar, con etiquetas accesibles que incluyen el nombre del registro. */
defineProps<{ name: string; editable?: boolean }>()
const emit = defineEmits<{ edit: []; remove: [] }>()
</script>

<template>
  <div class="flex shrink-0 items-center gap-1">
    <IconButton v-if="editable" icon="edit" :label="`Editar ${name}`" @click="emit('edit')" />
    <IconButton icon="trash" :label="`Eliminar ${name}`" tone="danger" @click="emit('remove')" />
  </div>
</template>
