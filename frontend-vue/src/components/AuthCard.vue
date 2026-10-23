<script setup lang="ts">
import { AUTH_FEATURES, ECG_PATHS, scrollToId, scrollToTop } from '@shared/uiConfig'
import EcgLine from './EcgLine.vue'
import Icon from './Icon.vue'
import PulseLogo from './PulseLogo.vue'

defineProps<{ title: string; subtitle: string }>()
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
          @click.prevent="scrollToId('acceso')"
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

        <a
          href="#acceso"
          class="mt-9 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-ink shadow-glow transition hover:bg-accent-hover"
          @click.prevent="scrollToId('acceso')"
        >
          Comenzar
          <Icon name="arrowDown" svg-class="h-4 w-4" :stroke-width="2.2" />
        </a>

        <ul class="mt-16 grid w-full gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
          <li v-for="feature in AUTH_FEATURES" :key="feature.title" class="pulse-card p-5">
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

      <EcgLine
        :d="ECG_PATHS.hero"
        view-box="0 0 600 120"
        preserve-aspect-ratio="none"
        svg-class="pointer-events-none absolute inset-x-0 bottom-24 h-28 w-full opacity-70"
        :stroke-width="1.8"
        :base-opacity="0.18"
        dash="30 170"
        runner-class="drop-shadow-[0_0_6px_#00F0FF]"
      />

      <a
        href="#acceso"
        class="relative z-10 mx-auto flex flex-col items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-[0.24em] text-fg-dim transition hover:text-accent"
        @click.prevent="scrollToId('acceso')"
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
