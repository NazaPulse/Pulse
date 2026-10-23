import { useCallback, useEffect, useState } from 'react'

import { extractErrorMessage } from '../lib/api'

/**
 * Carga inicial de un recurso con `loading`/`error`. `fetcher` debe ser estable (función de
 * módulo) para que `reload` no cambie en cada render.
 */
export function useLoader<T>(fetcher: () => Promise<T>, initial: T, errorMessage: string) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      setData(await fetcher())
    } catch (err) {
      setError(extractErrorMessage(err, errorMessage))
    } finally {
      setLoading(false)
    }
  }, [fetcher, errorMessage])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, setData, loading, error, setError, reload }
}
