import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { useThemeStore } from './stores/theme'

// Buffer polyfill is handled by vite-plugin-node-polyfills in vite.config.js
// No manual setup needed here

// Validate required environment variables in production
if (import.meta.env.PROD) {
  const requiredEnvVars = ['VITE_HELIUS_API_KEY']
  const missingVars = requiredEnvVars.filter(key => !import.meta.env[key])
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '))
    console.error('Please set these variables before building for production.')
    // In production, we'll still allow the app to run but log the error
    // The network.js file will handle the actual validation
  }
}

// Solana Wallets Vue setup
import SolanaWallets from 'solana-wallets-vue'
import 'solana-wallets-vue/styles.css'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { initializeWalletDetection } from './utils/walletDetection'

// Optimized wallet configuration for mobile support
// solana-wallets-vue automatically includes:
// - Mobile Wallet Adapter (MWA) for Android mobile connections via deep links
// - Wallet Standard support for automatic wallet detection (includes Backpack)
// 
// Mobile Wallet Adapter is automatically enabled on Android devices
// Wallet Standard wallets (like Backpack) are automatically discovered
// 
// Note: On mobile, especially in in-app browsers, Wallet Standard detection
// may be delayed. We initialize wallet detection early to ensure wallets
// are available when needed.
const walletOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
    // Note: Backpack and other Wallet Standard wallets are automatically detected
    // via the Wallet Standard integration in solana-wallets-vue
    // No need to explicitly add BackpackWalletAdapter - it's auto-discovered
    // 
    // For mobile support, we initialize wallet detection early to ensure
    // Wallet Standard wallets are detected even in in-app browsers
  ],
  autoConnect: true,
  // localStorageKey is used to persist wallet selection across sessions
  localStorageKey: 'walletName',
}

// Initialize wallet detection early for mobile devices
// This ensures Wallet Standard wallets (like Backpack) are detected
// even in in-app browsers where detection might be delayed
if (typeof window !== 'undefined') {
  initializeWalletDetection().catch(err => {
    console.warn('[Wallet Detection] Failed to initialize wallet detection:', err)
  })
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(SolanaWallets, walletOptions)

// Initialize theme store BEFORE mounting to ensure CSS variables are set
const themeStore = useThemeStore()
themeStore.initializeTheme()

app.mount('#app')
