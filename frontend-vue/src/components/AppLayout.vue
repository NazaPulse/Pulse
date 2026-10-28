<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'

import { ECG_PATHS, NAV_ITEMS } from '@shared/uiConfig'
import { useAuth } from '../auth/useAuth'
import EcgLine from './EcgLine.vue'
import Icon from './Icon.vue'
import PulseLogo from './PulseLogo.vue'

const router = useRouter()
const { logout } = useAuth()

function handleLogout() {
  logout()
  router.replace('/login')
}
</script>

<!-- Estructura común de las rutas protegidas: sidebar (desktop), tab bar (móvil) y contenido. -->
<template>
  <div class="min-h-screen">
    <aside
      class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-canvas/80 backdrop-blur-xl lg:flex"
    >
      <div class="px-6 pb-8 pt-7">
        <PulseLogo />
      </div>

      <p class="eyebrow px-6 pb-3 text-fg-dim">Navegación</p>
      <nav aria-label="Secciones" class="flex flex-1 flex-col gap-1 px-3">
        <RouterLink v-for="item in NAV_ITEMS" :key="item.to" :to="item.to" class="nav-link">
          <Icon :name="item.icon" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="m-3 rounded-2xl border border-line bg-surface/70 p-4">
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 animate-blink rounded-full bg-ok" aria-hidden="true" />
          <span class="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-fg-muted">
            Sesión activa
          </span>
        </div>
        <EcgLine :d="ECG_PATHS.sidebar" view-box="0 0 200 36" svg-class="mt-3 h-9 w-full" />
        <button
          type="button"
          class="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-white/[0.03] px-3 py-2 text-sm font-medium text-fg-soft transition hover:border-danger-soft/50 hover:text-danger-soft"
          @click="handleLogout"
        >
          <Icon name="logout" svg-class="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>

    <header
      class="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/80 px-4 py-3 backdrop-blur-xl lg:hidden"
    >
      <PulseLogo compact />
      <button
        type="button"
        aria-label="Cerrar sesión"
        class="rounded-lg border border-line-strong bg-white/[0.03] p-2 text-fg-soft transition hover:text-danger-soft"
        @click="handleLogout"
      >
        <Icon name="logout" svg-class="h-5 w-5" />
      </button>
    </header>

    <div class="pb-28 lg:pb-12 lg:pl-64">
      <RouterView />
    </div>

    <nav
      aria-label="Secciones"
      class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-canvas/90 backdrop-blur-xl lg:hidden"
    >
      <RouterLink v-for="item in NAV_ITEMS" :key="item.to" :to="item.to" class="tab-link">
        <Icon :name="item.icon" svg-class="h-6 w-6" />
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>
