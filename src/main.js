import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { useThemeStore } from './stores/theme'
import { logError, logWarning } from './utils/logger'

// Buffer polyfill is handled by vite-plugin-node-polyfills in vite.config.js
// No manual setup needed here

// Validate required environment variables in production
if (import.meta.env.PROD) {
  const requiredEnvVars = ['VITE_HELIUS_API_KEY']
  const missingVars = requiredEnvVars.filter(key => !import.meta.env[key])
  
  if (missingVars.length > 0) {
    logError('Missing required environment variables:', missingVars.join(', '))
    logError('Please set these variables before building for production.')
    // The network.js file will handle the actual validation and throw
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
import { ACTIVE_NETWORK, NETWORKS } from './utils/constants/networks'
import { initializeWalletDetection } from './utils/walletDetection'

// Single source of truth: ACTIVE_NETWORK. Wallet adapters and RPC (useSolanaConnection) both use mainnet.
const walletAdapterNetwork = ACTIVE_NETWORK === NETWORKS.MAINNET ? WalletAdapterNetwork.Mainnet : WalletAdapterNetwork.Devnet

// Wallet config: mainnet-only, mobile-friendly (MWA + Wallet Standard). One early init in main.js only.
const walletOptions = {
  wallets: [
    new PhantomWalletAdapter({ network: walletAdapterNetwork }),
    new SolflareWalletAdapter({ network: walletAdapterNetwork }),
  ],
  autoConnect: true,
  localStorageKey: 'walletName',
  network: walletAdapterNetwork,
}

// Single predictable flow: init wallet detection once at bootstrap (important for mobile in-app browsers).
if (typeof window !== 'undefined') {
  initializeWalletDetection().catch(err => {
    logWarning('[Wallet] Wallet detection initialization failed:', err)
  })
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize Solana Wallets with error handling
try {
  app.use(SolanaWallets, walletOptions)
} catch (err) {
  logError('[Wallet] Failed to initialize Solana Wallets:', err)
  // Don't throw - let the app continue, wallet connection will just fail gracefully
}

// Initialize theme store BEFORE mounting to ensure CSS variables are set
const themeStore = useThemeStore()
themeStore.initializeTheme()

app.mount('#app')
