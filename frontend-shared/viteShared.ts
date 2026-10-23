// Configuración de Vite común a ambos frontends (alias, proxy de desarrollo y tests). Cada
// `vite.config.ts` solo agrega su plugin de framework y su puerto.
import { fileURLToPath } from 'node:url'

/** Carpeta de este módulo: código compartido entre /frontend-react y /frontend-vue. */
export const SHARED_DIR = fileURLToPath(new URL('.', import.meta.url))

export function sharedViteConfig(options: { env: Record<string, string>; port: number; workspaceRoot: string }) {
  // Destino del proxy de desarrollo. Reenvía /api/* al backend y evita CORS cuando
  // VITE_API_BASE_URL queda vacío (mismo origen que el dev server).
  const target = options.env.VITE_DEV_PROXY_TARGET || 'http://localhost:3000'
  const proxied = { target, changeOrigin: true }

  return {
    resolve: { alias: { '@shared': SHARED_DIR } },
    server: {
      port: options.port,
      strictPort: false,
      fs: { allow: [options.workspaceRoot, SHARED_DIR] },
      // `/uploads` sirve los audios de las notas de voz (`audio_url` = /uploads/audio/...).
      proxy: { '/api': proxied, '/uploads': proxied },
    },
    test: {
      globals: true,
      include: ['src/**/*.spec.ts', '../frontend-shared/**/*.spec.ts'],
    },
  }
}
