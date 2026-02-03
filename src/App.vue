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

// Preload token registry in background (non-blocking). Wallet detection runs once in main.js.
onMounted(() => {
  const tokenStore = useTokenStore()
  tokenStore.preloadRegistry().catch(() => {})
})
</script>
