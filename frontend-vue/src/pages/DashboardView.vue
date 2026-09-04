<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '../auth/useAuth'

const router = useRouter()
const { token, logout } = useAuth()

function handleLogout() {
  logout()
  router.replace('/login')
}

const tokenPreview = computed(() =>
  token.value ? `${token.value.slice(0, 24)}…${token.value.slice(-8)}` : '—',
)
</script>

<template>
  <main class="min-h-screen bg-slate-100">
    <header class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6"
      >
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

    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Panel</h1>
      <p class="mt-1 text-sm text-slate-500">
        Autenticación exitosa. Esta vista es un placeholder protegido.
      </p>

      <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-sm font-medium text-slate-700">Token de acceso (JWT)</h2>
        <code
          class="mt-2 block break-all rounded-lg bg-slate-50 p-3 text-xs text-slate-600"
        >
          {{ tokenPreview }}
        </code>
        <p class="mt-3 text-xs text-slate-400">
          Guardado en <span class="font-mono">localStorage</span> y enviado como
          <span class="font-mono">Authorization: Bearer</span> en cada request.
        </p>
      </div>
    </section>
  </main>
</template>
