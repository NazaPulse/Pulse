import { useState } from 'react'

/** Estado de un formulario como objeto único, con un setter por campo. */
export function useFormValues<T extends object>(initial: T | (() => T)) {
  const [values, setValues] = useState<T>(initial)

  function setField<K extends keyof T>(key: K, value: T[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return { values, setField }
}
