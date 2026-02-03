import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // This ensures env vars are available in the config
  const env = loadEnv(mode, process.cwd(), '')
  
  // Debug: Log env vars in dev mode - CHECK YOUR TERMINAL WHERE YOU RUN npm run dev
  if (mode === 'development') {
    console.log('\n[Vite Config] ===== ENVIRONMENT VARIABLES DEBUG =====')
    console.log('[Vite Config] Current working directory:', process.cwd())
    console.log('[Vite Config] Mode:', mode)
    console.log('[Vite Config] VITE_HELIUS_RPC exists:', !!env.VITE_HELIUS_RPC)
    console.log('[Vite Config] VITE_HELIUS_RPC value:', env.VITE_HELIUS_RPC ? '***SET***' : 'NOT SET')
    console.log('[Vite Config] VITE_HELIUS_API_KEY exists:', !!env.VITE_HELIUS_API_KEY)
    console.log('[Vite Config] VITE_HELIUS_API_KEY value:', env.VITE_HELIUS_API_KEY ? '***SET***' : 'NOT SET')
    console.log('[Vite Config] All VITE_ keys found:', Object.keys(env).filter(k => k.startsWith('VITE_')))
    console.log('[Vite Config] =========================================\n')
  }

  return {
  plugins: [
    vue(),
    nodePolyfills({
      include: ['buffer'],
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['dguild-logo-p2p.svg', 'android-chrome-192x192.png', 'android-chrome-512x512.png'],
      manifest: {
        name: 'dGuild Escrow',
        short_name: 'dGuild',
        description: 'P2P Escrow Service for Solana SPL Tokens',
        theme_color: '#00951a',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        // Deep link support - allows app to handle URLs
        share_target: {
          action: '/',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        }
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Increase file size limit for precaching (default is 2MB)
        // Large JS bundles (4.73MB) need higher limit
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        // Exclude RPC endpoints from precaching to avoid caching API keys or sensitive data
        // API keys are embedded in JS bundle at build time (expected for client-side apps)
        // but we don't want to cache RPC responses that might contain transaction data
        navigateFallbackDenylist: [/^\/_/, /\/api\//, /helius-rpc\.com/, /\.solana\.com/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
          // Note: RPC endpoints (Helius, Solana) are explicitly NOT cached
          // to prevent caching sensitive transaction data or API keys
          // All RPC calls go directly to network without service worker caching
        ]
      },
      devOptions: {
        enabled: false // Disable PWA in dev mode for faster development
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    'process.env': {},
    global: 'globalThis',
    'process.browser': true
  },
  server: {
    port: 3000
  },
  optimizeDeps: {
    include: ['@solana/web3.js', '@solana/spl-token', 'buffer']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'solana': ['@solana/web3.js', '@solana/spl-token'],
          'anchor': ['@coral-xyz/anchor'],
          'wallet': ['solana-wallets-vue', '@solana/wallet-adapter-base', '@solana/wallet-adapter-wallets'],
          'vue': ['vue', 'vue-router', 'pinia'],
          'vendor-datepicker': ['@vuepic/vue-datepicker'],
          'vendor-qrcode': ['qrcode']
        }
      }
    },
    // More reasonable chunk size warning limit (500KB)
    chunkSizeWarningLimit: 500,
    // Sourcemaps for production error tracking (hidden to not expose source)
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
    // Optimize asset inlining (4KB threshold)
    assetsInlineLimit: 4096,
    // Minification (esbuild is default, fast and effective)
    // Remove console.logs in production builds
    minify: 'esbuild',
    // Remove console statements in production
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    }
  }
  }
})
