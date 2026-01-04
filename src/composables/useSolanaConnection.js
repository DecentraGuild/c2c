/**
 * Shared Solana Connection composable
 * Provides a singleton Connection instance to avoid creating multiple connections
 */

import { Connection } from '@solana/web3.js'
import { RPC_ENDPOINTS, NETWORKS } from '../utils/constants'

// Singleton connection instance with network tracking
let connectionInstance = null
let currentNetwork = null

/**
 * Get or create the shared Solana connection instance
 * @param {string} network - Network to connect to (default: MAINNET)
 * @param {string} commitment - Commitment level (default: 'confirmed')
 * @returns {Connection} Solana Connection instance
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

  // Create new connection instance
  const rpcUrl = RPC_ENDPOINTS[network]?.primary || RPC_ENDPOINTS[NETWORKS.MAINNET].primary
  connectionInstance = new Connection(rpcUrl, commitment)
  currentNetwork = network

  return connectionInstance
}

/**
 * Reset the connection instance (useful for testing or network switching)
 */
export function resetConnection() {
  connectionInstance = null
  currentNetwork = null
}
