<script setup lang="ts">
/** Marca "PULSE" con el trazo electrocardiográfico iluminado en cian neón. */
withDefaults(
  defineProps<{
    /** Solo el isotipo con el wordmark, sin la leyenda inferior. */
    compact?: boolean
  }>(),
  { compact: false },
)
</script>

<template>
  <div class="flex items-center gap-3">
    <span
      class="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-accent/40 bg-gradient-to-br from-panel to-canvas shadow-glow-sm"
    >
      <svg viewBox="0 0 24 24" fill="none" class="h-7 w-7 overflow-visible" aria-hidden="true">
        <path
          d="M2 12h5l2.5-6 4 12 2.5-6H22"
          stroke="#00F0FF"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="drop-shadow-[0_0_4px_#00F0FF]"
        />
        <path
          d="M2 12h5l2.5-6 4 12 2.5-6H22"
          stroke="#FFFFFF"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          pathLength="200"
          stroke-dasharray="14 186"
          class="animate-ecg"
        />
      </svg>
    </span>
    <span class="flex flex-col leading-none">
      <span
        class="font-display text-[1.35rem] font-bold tracking-[0.3em] text-fg [text-shadow:0_0_22px_rgb(0_240_255/0.45)]"
      >
        PULSE
      </span>
      <span
        v-if="!compact"
        class="mt-1.5 font-mono text-[0.625rem] uppercase tracking-[0.28em] text-fg-dim"
      >
        Gestión personal
      </span>
    </span>
  </div>
</template>
