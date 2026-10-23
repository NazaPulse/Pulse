/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite'
import { sharedViteConfig } from '../frontend-shared/viteShared.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue(), tailwindcss()],
  ...sharedViteConfig({
    env: loadEnv(mode, process.cwd(), ''),
    port: 5174,
    workspaceRoot: searchForWorkspaceRoot(process.cwd()),
  }),
}))
