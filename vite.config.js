/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' → onNeedRefresh fires and the UpdatePrompt toast can offer
      // "ری لوڈ کریں". Switch to 'autoUpdate' for silent background updates.
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'icons/icon-192x192.png', 'icons/icon-512x512.png'],
      manifest: {
        name: 'المکہ ماربل فیکٹری مینجمنٹ',
        short_name: 'المکہ ماربل',
        description: 'المکہ ماربل فیکٹری مینجمنٹ سسٹم — Al-Makkah Marble Factory management system',
        lang: 'ur',
        dir: 'rtl',
        theme_color: '#1E3A8A',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        shortcuts: [
          {
            name: 'حساب کتاب — Calculator',
            short_name: 'حساب کتاب',
            description: 'کٹنگ کا حساب — slab cutting calculator',
            url: '/#/calculator',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'ذخیرہ — Inventory',
            short_name: 'ذخیرہ',
            description: 'سلیب ذخیرہ — slab stock',
            url: '/#/inventory',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
          },
        ],
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // NOTE: Google Fonts runtime caching was removed — fonts are now
        // self-hosted via @fontsource and land in the precache (offline-first).
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks + per-page chunks (routes.jsx uses React.lazy)
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  // Vitest (npm test) — jsdom + setup file, one smoke test per page
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setupTests.js',
    css: true,
  },
})
