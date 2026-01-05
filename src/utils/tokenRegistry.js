/**
 * Shared Token Registry Utility
 * Single source of truth for token registry loading and caching
 * Used by both useTokenRegistry composable and metaplex utilities
 */

import { TokenListProvider } from '@solana/spl-token-registry'
import { cleanTokenString } from './formatters'

// Shared registry cache (module-level singleton)
let tokenRegistryList = null
let tokenRegistryMap = null
let registryLoadTime = null
let registryLoadPromise = null
const REGISTRY_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Load token registry and return as array for searching
 * @returns {Promise<Array>} Array of token objects
 */
export async function loadTokenRegistryList() {
  // Return existing promise if already loading
  if (registryLoadPromise) {
    return registryLoadPromise
  }

  // Return cached registry if still valid (within TTL)
  if (tokenRegistryList && registryLoadTime && 
      Date.now() - registryLoadTime < REGISTRY_CACHE_TTL) {
    return tokenRegistryList
  }
  
  // Clear expired cache
  if (tokenRegistryList && registryLoadTime && 
      Date.now() - registryLoadTime >= REGISTRY_CACHE_TTL) {
    tokenRegistryList = null
    tokenRegistryMap = null
    registryLoadTime = null
  }

  // Start loading registry
  registryLoadPromise = (async () => {
    try {
      const provider = new TokenListProvider()
      const tokenList = await provider.resolve()
      const mainnetTokens = tokenList.filterByClusterSlug('mainnet-beta').getList()
      
      // Convert to array format for easier searching
      tokenRegistryList = mainnetTokens.map(token => ({
        mint: token.address,
        name: cleanTokenString(token.name),
        symbol: cleanTokenString(token.symbol),
        image: token.logoURI || null,
        decimals: token.decimals || null
      }))
      
      // Also create Map format for fast lookups
      tokenRegistryMap = new Map()
      for (const token of tokenRegistryList) {
        tokenRegistryMap.set(token.mint, token)
      }
      
      // Set cache timestamp
      registryLoadTime = Date.now()
      
      return tokenRegistryList
    } catch (err) {
      console.warn('Failed to load token registry:', err)
      // Return empty array on error
      tokenRegistryList = []
      tokenRegistryMap = new Map()
      return tokenRegistryList
    } finally {
      registryLoadPromise = null
    }
  })()

  return registryLoadPromise
}

/**
 * Load token registry and return as Map for fast lookups
 * @returns {Promise<Map>} Map of mint address to token info
 */
export async function loadTokenRegistryMap() {
  // Ensure list is loaded first (which also creates the map)
  await loadTokenRegistryList()
  return tokenRegistryMap
}

/**
 * Get token from registry by mint address (fast lookup)
 * @param {string} mintAddress - Token mint address
 * @returns {Promise<Object|null>} Token info or null if not found
 */
export async function getTokenFromRegistry(mintAddress) {
  const registry = await loadTokenRegistryMap()
  return registry.get(mintAddress) || null
}

/**
 * Preload registry for better UX (call this early)
 * @returns {Promise<void>}
 */
export async function preloadTokenRegistry() {
  try {
    await loadTokenRegistryList()
  } catch (err) {
    // Silently fail - will fall back to on-chain metadata
    console.debug('Failed to preload token registry:', err.message)
  }
}
