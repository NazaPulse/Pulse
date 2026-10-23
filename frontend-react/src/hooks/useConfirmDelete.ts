import { useState } from 'react'

import { extractErrorMessage } from '../lib/api'

type ConfirmDeleteOptions<T> = {
  remove: (target: T) => Promise<void>
  onRemoved: (target: T) => void | Promise<void>
  onError: (message: string) => void
  errorMessage: string
}

/** Diálogo de confirmación de baja: objetivo elegido, estado `deleting` y manejo de errores. */
export function useConfirmDelete<T>({ remove, onRemoved, onError, errorMessage }: ConfirmDeleteOptions<T>) {
  const [target, setTarget] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirm() {
    if (!target) return
    setDeleting(true)
    try {
      await remove(target)
      setTarget(null)
      await onRemoved(target)
    } catch (err) {
      onError(extractErrorMessage(err, errorMessage))
    } finally {
      setDeleting(false)
    }
  }

  return { target, setTarget, deleting, confirm }
}
