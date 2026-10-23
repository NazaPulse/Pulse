<script setup lang="ts">
/** Pulso electrocardiográfico: línea cian tenue con un destello animado que la recorre. */
withDefaults(
  defineProps<{
    d: string
    viewBox: string
    svgClass: string
    strokeWidth?: number
    /** Opacidad de la línea base (la que queda siempre visible). */
    baseOpacity?: number
    baseClass?: string
    /** Color y tramo (`longitud espacio`) del destello que recorre la línea. */
    runnerColor?: string
    dash?: string
    runnerClass?: string
    preserveAspectRatio?: string
  }>(),
  {
    strokeWidth: 1.5,
    baseOpacity: 0.35,
    baseClass: '',
    runnerColor: '#00F0FF',
    dash: '26 174',
    runnerClass: 'drop-shadow-[0_0_3px_#00F0FF]',
    preserveAspectRatio: undefined,
  },
)
</script>

<template>
  <svg
    :viewBox="viewBox"
    fill="none"
    :class="svgClass"
    :preserveAspectRatio="preserveAspectRatio"
    aria-hidden="true"
  >
    <path
      :d="d"
      fill="none"
      stroke="#00F0FF"
      :stroke-opacity="baseOpacity"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      :class="baseClass"
    />
    <path
      :d="d"
      fill="none"
      :stroke="runnerColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      pathLength="200"
      :stroke-dasharray="dash"
      :class="['animate-ecg', runnerClass]"
    />
  </svg>
</template>
