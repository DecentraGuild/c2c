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
      includeAssets: ['dguild-logo.png'],
      manifest: {
        name: 'dGuild Escrow',
        short_name: 'dGuild',
        description: 'P2P Escrow Service for Solana SPL Tokens',
        theme_color: '#00d4ff',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/dguild-logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/dguild-logo.png',
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
          },
          {
            urlPattern: /^https:\/\/.*\.solana\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'solana-rpc-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 10
            }
          }
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
          'vue': ['vue', 'vue-router', 'pinia']
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
    // To remove console.logs in production, we'll handle it via esbuild options
    minify: 'esbuild'
  }
  }
})
