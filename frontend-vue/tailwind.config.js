/**
 * Pulse — Sistema de diseño "Cyber Dark · Neón Cyan".
 *
 * Paleta y tipografías de la marca. Es IDÉNTICO en frontend-react y frontend-vue
 * (paridad visual 100%); si cambia uno, cambia el otro.
 * Se carga desde `src/theme.css` con `@config` (Tailwind v4).
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  theme: {
    extend: {
      colors: {
        // Superficies
        canvas: '#0b0f17',
        surface: '#111827',
        panel: '#1e293b',
        ink: '#03141b', // texto sobre fondos cian
        line: { DEFAULT: '#1c2740', strong: '#2e3e5a' },

        // Texto
        fg: { DEFAULT: '#e8eef8', soft: '#c5d0e0', muted: '#94a3b8', dim: '#7b8aa0' },

        // Acento: cian eléctrico
        accent: {
          DEFAULT: '#00f0ff',
          hover: '#5cf6ff',
          strong: '#06b6d4',
          deep: '#0e7490',
        },

        // Semánticos
        ok: { DEFAULT: '#34d399', strong: '#047857', deep: '#065f46' },
        danger: { DEFAULT: '#e11d48', strong: '#be123c', soft: '#fb7185' },
        warn: '#fbbf24',
        info: { DEFAULT: '#38bdf8', strong: '#0369a1', deep: '#075985' },

        // Gráficos: paleta pastel sobre fondo oscuro
        chart: {
          blue: '#7db7ff',
          green: '#86e3ae',
          yellow: '#ffe08a',
          pink: '#ff9fc5',
          violet: '#b9a0ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Cascadia Mono', 'Consolas', 'monospace'],
      },
    },
  },
}
