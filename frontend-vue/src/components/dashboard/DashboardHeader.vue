<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useAuth } from '../../auth/useAuth'

const router = useRouter()
const { logout } = useAuth()

function handleLogout() {
  logout()
  router.replace('/login')
}
</script>

<template>
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
      <div class="flex items-center gap-2">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
        >
          P
        </div>
        <span class="font-semibold text-slate-900">Pulse</span>
      </div>
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        @click="handleLogout"
      >
        Cerrar sesión
      </button>
    </div>
  </header>
</template>
