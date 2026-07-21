import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { createRequire } from 'node:module'

const pkg = createRequire(import.meta.url)('./package.json')

// https://vite.dev/config/
export default defineConfig({
  base: '/rb2000-web/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'appicon.png'],
      manifest: {
        name: 'RB2000 — Rebreather Diving Calculator',
        short_name: 'RB2000',
        description: 'Oxygen, partial-pressure and gas-density calculations for semi-closed rebreather divers.',
        theme_color: '#007AFF',
        background_color: '#F2F2F7',
        display: 'standalone',
        orientation: 'portrait',
        // The app is served from a project subpath on GitHub Pages.
        scope: '/rb2000-web/',
        start_url: '/rb2000-web/',
        icons: [
          {
            src: 'appicon.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any',
          },
          {
            // Scalable fallback so launchers always have a large-size icon.
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
})
