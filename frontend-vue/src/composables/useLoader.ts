import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'

import { extractErrorMessage } from '../lib/api'

/** Carga inicial de un recurso con `loading`/`error`; `reload` vuelve a pedirlo sin spinner. */
export function useLoader<T>(fetcher: () => Promise<T>, initial: T, errorMessage: string) {
  const data = ref(initial) as Ref<T>
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function reload() {
    error.value = null
    try {
      data.value = await fetcher()
    } catch (err) {
      error.value = extractErrorMessage(err, errorMessage)
    } finally {
      loading.value = false
    }
  }

  onMounted(reload)

  return { data, loading, error, reload }
}
