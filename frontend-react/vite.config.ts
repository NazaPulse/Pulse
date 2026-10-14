/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite'

// Código común con el otro frontend (tipos, validaciones, cliente de la API, utils).
const SHARED_DIR = fileURLToPath(new URL('../frontend-shared', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Destino del proxy de desarrollo. Reenvía /api/* al backend y evita CORS
  // cuando VITE_API_BASE_URL queda vacío (mismo origen que el dev server).
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@shared': SHARED_DIR },
    },
    server: {
      port: 5173,
      strictPort: false,
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd()), SHARED_DIR],
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      include: ['src/**/*.spec.ts', '../frontend-shared/**/*.spec.ts'],
    },
  }
})
