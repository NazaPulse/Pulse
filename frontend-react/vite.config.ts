/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite'
import { sharedViteConfig } from '../frontend-shared/viteShared.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  ...sharedViteConfig({
    env: loadEnv(mode, process.cwd(), ''),
    port: 5173,
    workspaceRoot: searchForWorkspaceRoot(process.cwd()),
  }),
}))
