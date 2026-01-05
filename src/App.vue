<template>
  <div class="min-h-screen bg-primary-bg">
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
import { isMobileDevice, waitForWalletStandard, isBackpackAvailable } from './utils/walletDetection'

// Preload token registry early for better performance
onMounted(() => {
  const tokenStore = useTokenStore()
  tokenStore.preloadRegistry()
  
  // On mobile, wait a bit longer for Wallet Standard wallets to be injected
  // This is especially important for in-app browsers like Backpack
  if (isMobileDevice()) {
    // Wait for Wallet Standard after a short delay to allow wallets to inject
    setTimeout(async () => {
      const walletStandardAvailable = await waitForWalletStandard(2000)
      if (walletStandardAvailable) {
        console.log('[App] Wallet Standard detected after mount')
        
        // Check specifically for Backpack
        if (isBackpackAvailable()) {
          console.log('[App] Backpack wallet is available')
        }
      }
    }, 500)
  }
})
</script>
