/**
 * Composable for searching tokens in the Solana Token Registry
 * Supports searching by ticker, name, and token ID (mint address)
 */

import { ref, computed } from 'vue'
import { TokenListProvider } from '@solana/spl-token-registry'
import { useSolanaConnection } from './useSolanaConnection'
import { fetchTokenMetadata } from '../utils/metaplex'
import { metadataRateLimiter } from '../utils/rateLimiter'

// Token registry cache with expiration
let tokenRegistryList = null
let registryLoadTime = null
let registryLoadPromise = null
const REGISTRY_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Use shared connection
const connection = useSolanaConnection()

/**
 * Load token registry and return as array for searching
 * @returns {Promise<Array>} Array of token objects
 */
async function loadTokenRegistryList() {
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
        name: token.name?.trim() || null,
        symbol: token.symbol?.trim() || null,
        image: token.logoURI || null,
        decimals: token.decimals || null
      }))
      
      // Set cache timestamp
      registryLoadTime = Date.now()
      
      return tokenRegistryList
    } catch (err) {
      console.warn('Failed to load token registry:', err)
      // Return empty array on error
      tokenRegistryList = []
      return tokenRegistryList
    } finally {
      registryLoadPromise = null
    }
  })()

  return registryLoadPromise
}

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
      name: (metadata?.name || registryToken?.name || null)?.trim() || null,
      symbol: (metadata?.symbol || registryToken?.symbol || null)?.trim() || null,
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
      
      // Search by symbol, name, or mint address
      const results = registry.filter(token => {
        const symbolMatch = token.symbol?.toLowerCase().includes(lowerQuery)
        const nameMatch = token.name?.toLowerCase().includes(lowerQuery)
        const mintMatch = token.mint.toLowerCase().includes(lowerQuery)
        
        return symbolMatch || nameMatch || mintMatch
      })
      
      // Limit results to 50 for performance
      searchResults.value = results.slice(0, 50)
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
    try {
      await loadTokenRegistryList()
    } catch (err) {
      console.debug('Failed to preload token registry:', err.message)
    }
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
