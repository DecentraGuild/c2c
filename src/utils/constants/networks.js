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
  
  // Debug logging removed - use window.debugLogging = true to enable if needed

  // Try VITE_HELIUS_API_KEY first
  let apiKey = env.VITE_HELIUS_API_KEY

  // If not set, try to extract from VITE_HELIUS_RPC (backwards compatibility)
  if (!apiKey && env.VITE_HELIUS_RPC) {
    const rpcUrl = env.VITE_HELIUS_RPC
    const match = rpcUrl.match(/[?&]api-key=([^&]+)/)
    if (match) {
      apiKey = match[1]
    }
  }

  // Validate API key is provided
  if (!apiKey) {
    const errorMsg = 'VITE_HELIUS_API_KEY or VITE_HELIUS_RPC environment variable is required'
    if (env.PROD) {
      throw new Error(errorMsg)
    }
    // In development, throw error but with helpful message
    throw new Error(`${errorMsg}. Please set VITE_HELIUS_API_KEY in your .env file and restart the dev server.`)
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
