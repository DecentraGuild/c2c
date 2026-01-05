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

// Use shared connection
const connection = useSolanaConnection()

/**
 * Fetch token decimals from on-chain if not available in registry
 */
async function fetchTokenDecimals(mintAddress) {
  try {
    const { PublicKey } = await import('@solana/web3.js')
    
    const mintPubkey = new PublicKey(mintAddress)
    const accountInfo = await connection.getParsedAccountInfo(mintPubkey)
    
    if (accountInfo && accountInfo.value && accountInfo.value.data && 'parsed' in accountInfo.value.data) {
      return accountInfo.value.data.parsed.info.decimals
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
 * @returns {Promise<Object>} Token info { mint, name, symbol, image, decimals }
 */
async function fetchTokenInfo(mintAddress) {
  try {
    // First try to get from registry
    const registry = await loadTokenRegistryList()
    const registryToken = registry.find(t => t.mint === mintAddress)
    
    // Fetch metadata using hybrid approach
    const metadata = await metadataRateLimiter.execute(() =>
      fetchTokenMetadata(connection, mintAddress, true)
    )
    
    // Get decimals - prefer registry, then on-chain, then default to 9
    let decimals = registryToken?.decimals || null
    if (!decimals) {
      decimals = await fetchTokenDecimals(mintAddress)
    }
    if (!decimals) {
      decimals = 9 // Default fallback
    }
    
    return {
      mint: mintAddress,
      name: cleanTokenString(metadata?.name || registryToken?.name || null),
      symbol: cleanTokenString(metadata?.symbol || registryToken?.symbol || null),
      image: metadata?.image || registryToken?.image || null,
      decimals: decimals
    }
  } catch (err) {
    console.error(`Error fetching token info for ${mintAddress}:`, err)
    // Return minimal info with default decimals
    return {
      mint: mintAddress,
      name: null,
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
