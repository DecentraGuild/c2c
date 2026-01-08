/**
 * Composable for searching tokens in the Solana Token Registry
 * Supports searching by ticker, name, and token ID (mint address)
 */

import { ref, computed } from 'vue'
import { useSolanaConnection } from './useSolanaConnection'
import { fetchTokenMetadata } from '../utils/metaplex'
import { metadataRateLimiter } from '../utils/rateLimiter'
import { loadTokenRegistryList, preloadTokenRegistry as preloadSharedRegistry } from '../utils/tokenRegistry'
import { cleanTokenString } from '../utils/formatters'
import { getMint } from '@solana/spl-token'

// Use shared connection
const connection = useSolanaConnection()

/**
 * Fetch token decimals from on-chain if not available in registry
 * Uses getMint from @solana/spl-token for reliable decimal fetching
 */
async function fetchTokenDecimals(mintAddress) {
  try {
    const { PublicKey } = await import('@solana/web3.js')
    
    const mintPubkey = new PublicKey(mintAddress)
    const mintInfo = await getMint(connection, mintPubkey)
    
    if (mintInfo && typeof mintInfo.decimals === 'number') {
      return mintInfo.decimals
    }
    
    return null
  } catch (err) {
    console.debug(`Failed to fetch decimals for ${mintAddress}:`, err.message)
    return null
  }
}

/**
 * Fetch complete token info (metadata + decimals) for a mint address
 * This is the primary function for fetching complete token information.
 * It combines registry data, on-chain metadata, and decimals.
 * 
 * @param {string} mintAddress - Token mint address
 * @param {Function} getCachedTokenInfo - Optional function to check cache first
 * @returns {Promise<Object>} Token info { mint, name, symbol, image, decimals }
 */
async function fetchTokenInfo(mintAddress, getCachedTokenInfo = null) {
  // Check cache first if provided (from token store)
  if (getCachedTokenInfo) {
    const cached = getCachedTokenInfo(mintAddress)
    if (cached) {
      return cached // Return cached data immediately
    }
  }
  
  try {
    // First try to get from registry
    const registry = await loadTokenRegistryList()
    const registryToken = registry.find(t => t.mint === mintAddress)
    
    // Fetch metadata using hybrid approach
    const metadata = await metadataRateLimiter.execute(() =>
      fetchTokenMetadata(connection, mintAddress, true)
    )
    
    // Get decimals - prefer registry, then on-chain, then default to 9
    // Always try on-chain first to ensure accuracy, then fall back to registry
    let decimals = await fetchTokenDecimals(mintAddress)
    if (decimals === null || decimals === undefined) {
      decimals = registryToken?.decimals || null
    }
    if (decimals === null || decimals === undefined) {
      decimals = 9 // Default fallback (don't warn, it's common for new tokens)
    }
    
    // Only return data if we have at least a name (successful fetch)
    // If no name, return null name to indicate failure (won't be cached)
    const name = cleanTokenString(metadata?.name || registryToken?.name || null)
    const symbol = cleanTokenString(metadata?.symbol || registryToken?.symbol || null)
    const image = metadata?.image || registryToken?.image || null
    
    return {
      mint: mintAddress,
      name: name, // Will be null if fetch failed
      symbol: symbol,
      image: image,
      decimals: decimals
    }
  } catch (err) {
    // Only log non-rate-limit errors to reduce console spam
    const isRateLimit = err?.message?.includes('429') || 
                       err?.message?.includes('Too Many Requests') ||
                       err?.code === 429
    
    if (!isRateLimit) {
      console.debug(`Error fetching token info for ${mintAddress}:`, err.message)
    }
    
    // Return with null name to indicate failure (won't be cached, will retry)
    return {
      mint: mintAddress,
      name: null, // Null name = failed fetch, will retry on refresh
      symbol: null,
      image: null,
      decimals: 9
    }
  }
}

export function useTokenRegistry() {
  const loading = ref(false)
  const error = ref(null)
  const searchQuery = ref('')
  const searchResults = ref([])
  const customTokenInput = ref('')
  const fetchingTokenInfo = ref(false)

  /**
   * Search tokens in registry by ticker, name, or mint address
   */
  const searchTokens = async (query) => {
    if (!query || query.trim() === '') {
      searchResults.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const registry = await loadTokenRegistryList()
      const lowerQuery = query.toLowerCase().trim()
      
      // Helper to calculate match priority (higher = better match)
      const getMatchPriority = (token) => {
        const symbol = token.symbol?.toLowerCase() || ''
        const name = token.name?.toLowerCase() || ''
        const mint = token.mint.toLowerCase()
        
        // Exact symbol match (highest priority)
        if (symbol === lowerQuery) return 1000
        // Exact name match
        if (name === lowerQuery) return 900
        // Symbol starts with query
        if (symbol.startsWith(lowerQuery)) return 800
        // Name starts with query
        if (name.startsWith(lowerQuery)) return 700
        // Symbol contains query
        if (symbol.includes(lowerQuery)) return 600
        // Name contains query
        if (name.includes(lowerQuery)) return 500
        // Mint contains query (lowest priority)
        if (mint.includes(lowerQuery)) return 100
        
        return 0
      }
      
      // Search and score all tokens
      const scoredResults = registry
        .map(token => ({
          token,
          priority: getMatchPriority(token)
        }))
        .filter(({ priority }) => priority > 0) // Only include matches
        .sort((a, b) => b.priority - a.priority) // Sort by priority descending
      
      // Extract tokens, prioritizing exact matches
      const results = scoredResults.map(({ token }) => token)
      
      // Limit results to 100 to ensure we get exact matches even if there are many partial matches
      // The component will further filter and limit to 50
      searchResults.value = results.slice(0, 100)
    } catch (err) {
      console.error('Error searching tokens:', err)
      error.value = err.message || 'Failed to search tokens'
      searchResults.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Handle custom token ID input and fetch token info
   */
  const handleCustomToken = async (mintAddress) => {
    if (!mintAddress || mintAddress.trim() === '') {
      return null
    }

    fetchingTokenInfo.value = true
    error.value = null

    try {
      // Validate address format
      const { PublicKey } = await import('@solana/web3.js')
      new PublicKey(mintAddress.trim())
      
      // Fetch token info
      const tokenInfo = await fetchTokenInfo(mintAddress.trim())
      return tokenInfo
    } catch (err) {
      if (err.message && err.message.includes('Invalid public key')) {
        error.value = 'Invalid token address format'
      } else {
        error.value = err.message || 'Failed to fetch token info'
      }
      return null
    } finally {
      fetchingTokenInfo.value = false
    }
  }

  /**
   * Preload registry for better UX
   */
  const preloadRegistry = async () => {
    return preloadSharedRegistry()
  }

  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    searchQuery,
    searchResults: computed(() => searchResults.value),
    customTokenInput,
    fetchingTokenInfo: computed(() => fetchingTokenInfo.value),
    searchTokens,
    handleCustomToken,
    preloadRegistry,
    fetchTokenInfo
  }
}
