<template>
  <div class="min-h-screen bg-primary-bg safe-area-y">
    <NavBar />
    <RouterView />
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import ToastContainer from './components/ToastContainer.vue'
import { useTokenStore } from './stores/token'
import { useThemeStore } from './stores/theme'
import { isMobileDevice, waitForWalletStandard, isBackpackAvailable } from './utils/walletDetection'
import { useNetworkStatus } from './composables/useNetworkStatus'

// Theme store is already initialized in main.js before app mount
// This ensures CSS variables are available immediately for all components

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
