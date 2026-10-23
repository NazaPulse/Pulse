<script setup lang="ts">
import { RouterLink } from 'vue-router'

import type { AuthCopy } from '@shared/authForms'

/** Pie de las pantallas de acceso: pregunta + enlace a la otra pantalla. */
defineProps<{ copy: AuthCopy }>()
</script>

<template>
  {{ copy.footerText }}
  <RouterLink :to="copy.footerTo" class="font-semibold text-accent hover:text-accent-hover">
    {{ copy.footerLink }}
  </RouterLink>
</template>
