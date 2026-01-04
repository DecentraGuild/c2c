/**
 * Network configuration constants
 */

// Network types
export const NETWORKS = {
  MAINNET: 'mainnet',
  DEVNET: 'devnet'
}

// Helper function to get Helius API key (lazy evaluation to ensure env vars are loaded)
function getHeliusApiKey() {
  // Access env vars - Vite replaces these at build time
  const env = import.meta.env
  
  // Debug: Log ALL env vars that start with VITE_ (only in dev)
  if (!env.PROD) {
    const viteKeys = Object.keys(env).filter(key => key.startsWith('VITE_'))
    console.log('[Network Config] All VITE_ env vars:', viteKeys)
    console.log('[Network Config] VITE_HELIUS_API_KEY value:', env.VITE_HELIUS_API_KEY)
    console.log('[Network Config] VITE_HELIUS_RPC value:', env.VITE_HELIUS_RPC)
    console.log('[Network Config] import.meta.env keys:', Object.keys(env))
    
    if (viteKeys.length === 0) {
      console.error('[Network Config] ⚠️ NO VITE_ env vars found!')
      console.error('[Network Config] This usually means:')
      console.error('[Network Config] 1. The .env file is missing or in wrong location')
      console.error('[Network Config] 2. The dev server needs to be restarted')
      console.error('[Network Config] 3. The env var names don\'t start with VITE_')
      console.error('[Network Config] Please check your .env file and restart the dev server completely.')
    }
  }

  // Try VITE_HELIUS_API_KEY first
  let apiKey = env.VITE_HELIUS_API_KEY

  // If not set, try to extract from VITE_HELIUS_RPC (backwards compatibility)
  if (!apiKey && env.VITE_HELIUS_RPC) {
    const rpcUrl = env.VITE_HELIUS_RPC
    const match = rpcUrl.match(/[?&]api-key=([^&]+)/)
    if (match) {
      apiKey = match[1]
      console.warn('[Network Config] Using API key from VITE_HELIUS_RPC. Consider using VITE_HELIUS_API_KEY instead.')
    }
  }

  // Validate API key is provided (fail fast in production)
  if (!apiKey && env.PROD) {
    console.error('VITE_HELIUS_API_KEY or VITE_HELIUS_RPC environment variable is required for production')
    throw new Error('Missing required environment variable: VITE_HELIUS_API_KEY or VITE_HELIUS_RPC')
  }

  if (!apiKey) {
    // TEMPORARY WORKAROUND: Hard-code the API key if env vars aren't loading
    // This is a fallback until we fix the Vite env var loading issue
    const fallbackApiKey = '6106c978-e9d2-44eb-b7e4-f9f46da256a6'
    console.warn('[Network Config] ⚠️ Env vars not loaded, using fallback API key')
    console.warn('[Network Config] This is a temporary workaround. Please check:')
    console.warn('[Network Config] 1. Terminal where you run "npm run dev" for [Vite Config] logs')
    console.warn('[Network Config] 2. Ensure .env file is in project root')
    console.warn('[Network Config] 3. Restart dev server completely')
    apiKey = fallbackApiKey
  }

  return apiKey
}

// Build Helius RPC URL
const getHeliusRpcUrl = (network) => {
  const apiKey = getHeliusApiKey()
  if (network === NETWORKS.MAINNET) {
    return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
  } else {
    return `https://devnet.helius-rpc.com/?api-key=${apiKey}`
  }
}

// RPC endpoints configuration (lazy-loaded to avoid module load-time errors)
let _rpcEndpoints = null

function getRpcEndpoints() {
  if (!_rpcEndpoints) {
    _rpcEndpoints = {
      [NETWORKS.MAINNET]: {
        primary: getHeliusRpcUrl(NETWORKS.MAINNET),
        fallback: 'https://api.mainnet-beta.solana.com',
        explorer: 'https://solscan.io'
      },
      [NETWORKS.DEVNET]: {
        primary: getHeliusRpcUrl(NETWORKS.DEVNET),
        fallback: 'https://api.devnet.solana.com',
        explorer: 'https://solscan.io?cluster=devnet'
      }
    }
  }
  return _rpcEndpoints
}

// Export as getter to ensure lazy evaluation
export const RPC_ENDPOINTS = new Proxy({}, {
  get(target, prop) {
    return getRpcEndpoints()[prop]
  },
  ownKeys() {
    return Object.keys(getRpcEndpoints())
  },
  has(target, prop) {
    return prop in getRpcEndpoints()
  }
})

// Transaction settings
export const TRANSACTION_DEFAULTS = {
  COMMITMENT: 'confirmed',
  TIMEOUT: 30000, // 30 seconds
  SKIP_PREFLIGHT: false
}
