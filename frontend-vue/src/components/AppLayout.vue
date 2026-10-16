<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'

import DashboardHeader from './dashboard/DashboardHeader.vue'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Finanzas' },
  { to: '/tasks', label: 'Tareas' },
  { to: '/notes', label: 'Notas' },
  { to: '/pomodoro', label: 'Pomodoro' },
]

const route = useRoute()

function linkClass(to: string): string {
  return [
    'whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition',
    route.path === to
      ? 'border-indigo-600 text-indigo-700'
      : 'border-transparent text-slate-500 hover:text-slate-800',
  ].join(' ')
}
</script>

<!-- Estructura común de las rutas protegidas: cabecera, navegación y contenido. -->
<template>
  <main class="min-h-screen bg-slate-100 pb-16">
    <DashboardHeader>
      <nav aria-label="Secciones" class="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 sm:px-6">
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          :class="linkClass(item.to)"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </DashboardHeader>

    <RouterView />
  </main>
</template>
