type Nullable<T> = { [K in keyof T]: T[K] | null | undefined }

/** `values` con cada `null`/`undefined` reemplazado por el valor de `defaults` (con el orden de claves de `defaults`). */
export function withDefaults<T extends object>(values: Nullable<T>, defaults: T): T {
  const entries = Object.entries(defaults).map(([key, fallback]) => [key, values[key as keyof T] ?? fallback])
  return Object.fromEntries(entries) as T
}
