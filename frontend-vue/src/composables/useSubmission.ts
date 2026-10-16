import { ref } from 'vue'

import { extractErrorMessage } from '../lib/api'

interface SubmitOptions {
  /** Liberar el botón también tras un éxito (si el formulario sigue montado). */
  resetOnSuccess?: boolean
}

/** Estado de envío común: `submitting`, mensaje de error y manejo del try/catch. */
export function useSubmission(fallbackMessage: string) {
  const submitting = ref(false)
  const error = ref<string | null>(null)

  async function submit(action: () => Promise<void>, { resetOnSuccess = false }: SubmitOptions = {}) {
    submitting.value = true
    error.value = null
    try {
      await action()
    } catch (err) {
      error.value = extractErrorMessage(err, fallbackMessage)
      submitting.value = false
      return
    }
    if (resetOnSuccess) submitting.value = false
  }

  return { submitting, error, submit }
}
