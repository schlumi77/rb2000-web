/// <reference types="vitest/config" />
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
  test: {
    // Component tests render into a simulated DOM.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
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
        // 192 and 512 px are the sizes Android expects for install and the
        // splash screen; the 1024 px source covers larger displays.
        icons: [
          {
            src: 'appicon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'appicon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
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
