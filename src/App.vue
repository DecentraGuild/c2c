<template>
  <div class="min-h-screen bg-primary-bg safe-area-y">
    <NavBar />
    <RouterView />
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import ToastContainer from './components/ToastContainer.vue'
import { useTokenStore } from './stores/token'
import { useThemeStore } from './stores/theme'
import { useStorefrontStore } from './stores/storefront'
import { isMobileDevice, waitForWalletStandard } from './utils/walletDetection'
import { useNetworkStatus } from './composables/useNetworkStatus'

const route = useRoute()
const themeStore = useThemeStore()
const storefrontStore = useStorefrontStore()

// Theming only on storefront (2nd layer) routes; Explore (/) and Host (/onboard) always use default theme
const STOREFRONT_ROUTE_PATHS = ['/marketplace', '/create', '/manage']
const isStorefrontRoute = (path) =>
  STOREFRONT_ROUTE_PATHS.includes(path) || path.startsWith('/escrow/')

watch(
  () => ({ path: route.path, storefront: storefrontStore.selectedStorefront }),
  ({ path, storefront }) => {
    if (path === '/' || path === '/onboard') {
      themeStore.resetToDefault()
      return
    }
    if (isStorefrontRoute(path)) {
      if (storefront?.colors) {
        storefrontStore.loadStorefrontTheme(storefront)
      } else {
        themeStore.resetToDefault()
      }
    } else {
      themeStore.resetToDefault()
    }
  },
  { immediate: true }
)

// Initialize network status monitoring (for mobile)
useNetworkStatus()

// Preload token registry in background (non-blocking, lazy loaded)
// Registry will load on-demand when user searches tokens
// This reduces initial bundle size by ~2-3 MB
onMounted(() => {
  const tokenStore = useTokenStore()
  // Preload in background - won't block initial load
  // Registry will be lazy loaded when actually needed
  tokenStore.preloadRegistry().catch(() => {
    // Silently fail - registry will load on-demand when needed
  })
  
  // On mobile, wait a bit longer for Wallet Standard wallets to be injected
  // This is especially important for in-app browsers like Backpack
  if (isMobileDevice()) {
    // Wait for Wallet Standard after a short delay to allow wallets to inject
    setTimeout(async () => {
      await waitForWalletStandard(2000)
      // Wallet detection happens silently - no logging needed
    }, 500)
  }
})
</script>
