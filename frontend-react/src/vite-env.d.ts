/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API. Vacío = mismo origen (proxy de Vite). */
  readonly VITE_API_BASE_URL: string
  /** Destino del proxy de desarrollo para /api/* (sólo usado por vite.config). */
  readonly VITE_DEV_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
