<script setup lang="ts">
import type { IconName } from '../lib/icons'
import Icon from './Icon.vue'
import PulseLogo from './PulseLogo.vue'

defineProps<{ title: string; subtitle: string }>()

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'finance', title: 'Finanzas por sobres', text: 'Cuentas, presupuestos y movimientos en un solo tablero.' },
  { icon: 'tasks', title: 'Tareas con prioridad', text: 'Organizá el día y no pierdas ningún vencimiento.' },
  { icon: 'notes', title: 'Notas y audios', text: 'Ideas en texto o grabadas con tu voz.' },
  { icon: 'timer', title: 'Foco con Pomodoro', text: 'Bloques de concentración con descansos medidos.' },
]

function scrollToAccess() {
  document.getElementById('acceso')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<!-- Pantalla de acceso: portada de marca arriba y, al deslizar, el formulario. -->
<template>
  <main>
    <section class="relative flex min-h-screen flex-col overflow-hidden px-5 py-6 sm:px-10">
      <header class="relative z-10 flex items-center justify-between gap-4">
        <PulseLogo />
        <a
          href="#acceso"
          class="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20"
          @click.prevent="scrollToAccess"
        >
          Ir al acceso
        </a>
      </header>

      <div
        class="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center py-14 text-center"
      >
        <p class="eyebrow animate-rise">Tu centro de control</p>
        <h2 class="mt-5 text-5xl font-bold leading-[1.02] tracking-tight text-fg sm:text-7xl">
          Todo tu día,
          <br />
          <span class="text-glow text-accent">en pulso.</span>
        </h2>
        <p class="mt-6 max-w-2xl text-base text-fg-muted sm:text-lg">
          Finanzas, tiempo, tareas y notas en una plataforma precisa, rápida y diseñada para que no
          tengas que saltar entre apps.
        </p>

        <div class="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#acceso"
            class="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-ink shadow-glow transition hover:bg-accent-hover"
            @click.prevent="scrollToAccess"
          >
            Comenzar
            <Icon name="arrowDown" svg-class="h-4 w-4" :stroke-width="2.2" />
          </a>
        </div>

        <ul class="mt-16 grid w-full gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
          <li v-for="feature in FEATURES" :key="feature.title" class="pulse-card p-5">
            <span
              class="grid h-10 w-10 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent"
            >
              <Icon :name="feature.icon" svg-class="h-5 w-5" />
            </span>
            <p class="mt-4 text-sm font-semibold text-fg">{{ feature.title }}</p>
            <p class="mt-1.5 text-xs leading-relaxed text-fg-muted">{{ feature.text }}</p>
          </li>
        </ul>
      </div>

      <svg
        viewBox="0 0 600 120"
        fill="none"
        preserveAspectRatio="none"
        class="pointer-events-none absolute inset-x-0 bottom-24 h-28 w-full opacity-60"
        aria-hidden="true"
      >
        <path
          d="M0 70h230l24-46 34 92 28-46h284"
          stroke="#00F0FF"
          stroke-opacity=".18"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M0 70h230l24-46 34 92 28-46h284"
          stroke="#00F0FF"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          pathLength="200"
          stroke-dasharray="30 170"
          class="animate-ecg drop-shadow-[0_0_6px_#00F0FF]"
        />
      </svg>

      <a
        href="#acceso"
        class="group relative z-10 mx-auto flex flex-col items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-[0.24em] text-fg-dim transition hover:text-accent"
        @click.prevent="scrollToAccess"
      >
        Deslizá para ingresar
        <Icon name="arrowDown" svg-class="h-5 w-5 animate-bounce" />
      </a>
    </section>

    <section
      id="acceso"
      class="relative flex min-h-screen flex-col items-center justify-center border-t border-line px-4 py-16 sm:px-8"
    >
      <div class="w-full max-w-md animate-rise">
        <div class="mb-8 flex justify-center">
          <PulseLogo />
        </div>

        <div class="mb-6 text-center">
          <p class="eyebrow">Acceso seguro</p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-fg">{{ title }}</h1>
          <p class="mt-1.5 text-sm text-fg-muted">{{ subtitle }}</p>
        </div>

        <div class="pulse-card hud-corners p-6 sm:p-8">
          <slot />
        </div>

        <p v-if="$slots.footer" class="mt-6 text-center text-sm text-fg-muted">
          <slot name="footer" />
        </p>

        <a
          href="#top"
          class="mx-auto mt-10 flex w-fit items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-fg-dim transition hover:text-accent"
          @click.prevent="scrollToTop"
        >
          <Icon name="arrowUp" svg-class="h-4 w-4" />
          Volver al inicio
        </a>
      </div>
    </section>
  </main>
</template>
