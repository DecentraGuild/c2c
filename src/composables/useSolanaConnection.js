/**
 * Shared Solana Connection composable
 * Provides a singleton Connection instance to avoid creating multiple connections
 * 
 * IMPORTANT: Network cluster configuration
 * - The Connection infers the cluster (mainnet-beta, devnet) from the RPC endpoint URL
 * - Mainnet RPC URLs (e.g., mainnet.helius-rpc.com) automatically configure for mainnet-beta cluster
 * - Devnet RPC URLs (e.g., devnet.helius-rpc.com) automatically configure for devnet cluster
 * - This ensures the Connection is properly configured for the specified network
 */

import { Connection } from '@solana/web3.js'
import { RPC_ENDPOINTS, NETWORKS } from '../utils/constants'
import { logWarning, logDebug } from '../utils/logger'

// Singleton connection instance with network tracking
let connectionInstance = null
let currentNetwork = null

/**
 * Get or create the shared Solana connection instance
 * @param {string} network - Network to connect to (default: MAINNET)
 *   - NETWORKS.MAINNET: Connects to Solana mainnet-beta cluster
 *   - NETWORKS.DEVNET: Connects to Solana devnet cluster
 * @param {string} commitment - Commitment level (default: 'confirmed')
 * @returns {Connection} Solana Connection instance configured for the specified network cluster
 */
export function useSolanaConnection(network = NETWORKS.MAINNET, commitment = 'confirmed') {
  // Reset connection if network changed
  if (connectionInstance && currentNetwork !== network) {
    connectionInstance = null
    currentNetwork = null
  }

  // Return existing instance if it exists and matches the network
  if (connectionInstance) {
    return connectionInstance
  }

  // Get RPC endpoint for the specified network
  // The RPC URL determines the cluster:
  // - mainnet.helius-rpc.com -> mainnet-beta cluster
  // - devnet.helius-rpc.com -> devnet cluster
  const rpcUrl = RPC_ENDPOINTS[network]?.primary || RPC_ENDPOINTS[NETWORKS.MAINNET].primary
  
  // Validate RPC URL matches expected network
  if (network === NETWORKS.MAINNET && !rpcUrl.includes('mainnet')) {
    logWarning('[Connection] Warning: Mainnet network specified but RPC URL does not contain "mainnet"')
  }
  if (network === NETWORKS.DEVNET && !rpcUrl.includes('devnet')) {
    logWarning('[Connection] Warning: Devnet network specified but RPC URL does not contain "devnet"')
  }

  // Create new connection instance
  // The Connection constructor infers the cluster from the RPC endpoint URL
  // This ensures proper network cluster configuration (mainnet-beta or devnet)
  connectionInstance = new Connection(rpcUrl, {
    commitment,
    confirmTransactionInitialTimeout: 60000, // 60 seconds timeout
  })
  currentNetwork = network

  logDebug(`[Connection] Created new Solana connection for ${network} cluster (${rpcUrl})`)

  return connectionInstance
}

/**
 * Reset the connection instance (useful for testing or network switching)
 */
export function resetConnection() {
  connectionInstance = null
  currentNetwork = null
}
