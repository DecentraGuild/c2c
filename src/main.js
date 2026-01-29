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
//
// IMPORTANT: Explicitly specifying the network cluster for all wallet adapters ensures
// that wallets like Backpack on mobile know to use Solana mainnet-beta cluster. Without this,
// some wallets may default to devnet or custom networks, causing "SVM network"
// errors. This is especially critical for Wallet Standard wallets on mobile.
//
// Network Cluster Configuration:
// - WalletAdapterNetwork.Mainnet = 'mainnet-beta' cluster
// - WalletAdapterNetwork.Devnet = 'devnet' cluster
// - WalletAdapterNetwork.Testnet = 'testnet' cluster
//
// By explicitly setting network: WalletAdapterNetwork.Mainnet, we ensure:
// 1. All wallet adapters (Phantom, Solflare, Backpack, etc.) connect to mainnet-beta
// 2. The Connection instance uses mainnet RPC endpoints
// 3. Mobile wallets receive the correct network information during connection
const walletOptions = {
  wallets: [
    // Explicitly specify mainnet-beta cluster for each wallet adapter
    new PhantomWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
    new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
    // Note: Backpack and other Wallet Standard wallets are automatically detected
    // via the Wallet Standard integration in solana-wallets-vue
    // No need to explicitly add BackpackWalletAdapter - it's auto-discovered
    // 
    // For mobile support, we initialize wallet detection early to ensure
    // Wallet Standard wallets are detected even in in-app browsers
    //
    // The network specification above ensures Wallet Standard wallets (like Backpack)
    // receive the correct network information during connection, preventing "SVM network"
    // errors on mobile devices.
  ],
  autoConnect: true,
  // localStorageKey is used to persist wallet selection across sessions
  localStorageKey: 'walletName',
  // Explicitly set network cluster to mainnet-beta for all wallets
  // This ensures mobile wallets (especially Backpack) know to use Solana mainnet-beta cluster
  // This is critical for preventing "SVM network" errors on mobile devices
  network: WalletAdapterNetwork.Mainnet, // Equivalent to 'mainnet-beta' cluster
}

// Initialize wallet detection early for mobile devices
// This ensures Wallet Standard wallets (like Backpack) are detected
// even in in-app browsers where detection might be delayed
if (typeof window !== 'undefined') {
  initializeWalletDetection().catch(err => {
    // Silently fail - wallet detection is optional
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
