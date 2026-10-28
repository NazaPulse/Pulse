import { useRef, useState } from 'react'

import { FOCUS_SESSION_MINUTES, focusRecordedMessage, loadFocusTarget, saveFocusTarget } from '@shared/schedule'
import type { FocusTarget } from '@shared/schedule'
import { api } from '../../lib/api'

/** Bloque del Cronograma enfocado ("Enfocar"): cada Pomodoro de trabajo suma minutos reales. */
export function useFocusTarget() {
  const [target, setTarget] = useState<FocusTarget | null>(() => loadFocusTarget())
  // El callback de fin de bloque del reloj lee siempre el objetivo vigente.
  const targetRef = useRef(target)

  function update(next: FocusTarget | null) {
    targetRef.current = next
    saveFocusTarget(next)
    setTarget(next)
  }

  /** Suma minutos reales al bloque; devuelve el aviso a mostrar, o `null` si no hay objetivo. */
  async function recordSession(minutes = FOCUS_SESSION_MINUTES): Promise<string | null> {
    const current = targetRef.current
    if (!current || minutes <= 0) return null
    try {
      const updated = await api.updateTimeBlock(current.blockId, {
        actual_duration_minutes: current.actualMinutes + minutes,
      })
      update({ ...current, actualMinutes: updated.actual_duration_minutes })
      return focusRecordedMessage(current, minutes)
    } catch {
      // El bloque ya no existe (o no es del usuario): se deja de imputar.
      update(null)
      return null
    }
  }

  return { target, clear: () => update(null), recordSession }
}
