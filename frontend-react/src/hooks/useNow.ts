import { useEffect, useState } from 'react'

/** Instante actual refrescado cada `everyMs` (para marcar vencimientos sin recargar). */
export function useNow(everyMs: number): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), everyMs)
    return () => window.clearInterval(id)
  }, [everyMs])

  return now
}
