import { useState } from 'react'

import { extractErrorMessage } from '../lib/api'

interface SubmitOptions {
  /** Liberar el botón también tras un éxito (si el formulario sigue montado). */
  resetOnSuccess?: boolean
}

/** Estado de envío común: `submitting`, mensaje de error y manejo del try/catch. */
export function useSubmission(fallbackMessage: string) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(action: () => Promise<void>, { resetOnSuccess = false }: SubmitOptions = {}) {
    setSubmitting(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(extractErrorMessage(err, fallbackMessage))
      setSubmitting(false)
      return
    }
    if (resetOnSuccess) setSubmitting(false)
  }

  return { submitting, error, submit }
}
