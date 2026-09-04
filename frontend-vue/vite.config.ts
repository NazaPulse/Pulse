import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Destino del proxy de desarrollo. Reenvía /api/* al backend y evita CORS
  // cuando VITE_API_BASE_URL queda vacío (mismo origen que el dev server).
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [vue(), tailwindcss()],
    server: {
      port: 5174,
      strictPort: false,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
