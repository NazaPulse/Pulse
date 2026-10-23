import { onBeforeUnmount, ref } from 'vue'

/** Instante actual refrescado cada `everyMs` (para marcar vencimientos sin recargar). */
export function useNow(everyMs: number) {
  const now = ref(Date.now())
  const id = window.setInterval(() => {
    now.value = Date.now()
  }, everyMs)
  onBeforeUnmount(() => window.clearInterval(id))
  return now
}
