import { ref, shallowRef } from 'vue'

import { extractErrorMessage } from '../lib/api'

interface ConfirmDeleteOptions<T> {
  remove: (target: T) => Promise<void>
  onRemoved: (target: T) => void | Promise<void>
  onError: (message: string) => void
  errorMessage: string
}

/** Diálogo de confirmación de baja: objetivo elegido, estado `deleting` y manejo de errores. */
export function useConfirmDelete<T>({ remove, onRemoved, onError, errorMessage }: ConfirmDeleteOptions<T>) {
  const target = shallowRef<T | null>(null)
  const deleting = ref(false)

  function setTarget(next: T | null) {
    target.value = next
  }

  async function confirm() {
    const current = target.value
    if (!current) return
    deleting.value = true
    try {
      await remove(current)
      target.value = null
      await onRemoved(current)
    } catch (err) {
      onError(extractErrorMessage(err, errorMessage))
    } finally {
      deleting.value = false
    }
  }

  return { target, setTarget, deleting, confirm }
}
