/**
 * Token Store
 * Centralized store for token data to prevent duplicate loading
 * Includes localStorage caching for better performance
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useWalletBalances } from '../composables/useWalletBalances'
import { useTokenRegistry } from '../composables/useTokenRegistry'
import { logDebug } from '../utils/logger'
import { STORAGE_KEYS, CACHE_CONFIG } from '../utils/constants/ui'
import { 
  getCachedData, 
  setCachedData, 
  isCacheValid, 
  limitCacheEntries 
} from '../utils/cacheManager'

// Use constants for cache TTL
const CACHE_TTL = {
  METADATA: CACHE_CONFIG.METADATA_TTL
}

export const useTokenStore = defineStore('token', () => {
  // Shared wallet balances instance
  // Pinia stores are singletons, so this will only be created once
  const walletBalances = useWalletBalances({ autoFetch: true })
  
  // Shared token registry instance (already singleton at module level)
  const tokenRegistry = useTokenRegistry()
  
  // Cache for token metadata (mint -> metadata)
  const tokenMetadataCache = ref(new Map())
  
  // Loading states
  const loadingBalances = computed(() => walletBalances.loading.value)
  const loadingMetadata = computed(() => walletBalances.loadingMetadata.value)
  const loadingRegistry = computed(() => tokenRegistry.loading.value)
  
  // Balances (from wallet)
  const balances = computed(() => walletBalances.balances.value)
  
  // Errors
  const balancesError = computed(() => walletBalances.error.value)
  const registryError = computed(() => tokenRegistry.error.value)
  
  /**
   * Load cached metadata from localStorage on initialization
   */
  function loadCachedMetadata() {
    try {
      const cached = getCachedData(STORAGE_KEYS.TOKEN_METADATA)
      const timestamp = getCachedData(STORAGE_KEYS.CACHE_TIMESTAMP)
      
      if (cached && Array.isArray(cached) && timestamp && isCacheValid(timestamp, CACHE_TTL.METADATA)) {
        // Convert array of [key, value] pairs back to Map
        tokenMetadataCache.value = new Map(cached)
        logDebug(`Loaded ${cached.length} cached token metadata entries from localStorage`)
        return true
      } else if (cached && Array.isArray(cached)) {
        // Cache expired, clear it
        logDebug('Token metadata cache expired, clearing...')
        localStorage.removeItem(STORAGE_KEYS.TOKEN_METADATA)
        localStorage.removeItem(STORAGE_KEYS.CACHE_TIMESTAMP)
      }
    } catch (err) {
      logDebug('Failed to load cached metadata:', err)
      // Clear corrupted cache
      try {
        localStorage.removeItem(STORAGE_KEYS.TOKEN_METADATA)
        localStorage.removeItem(STORAGE_KEYS.CACHE_TIMESTAMP)
      } catch {}
    }
    return false
  }
  
  /**
   * Save metadata to cache
   */
  function cacheMetadata(mint, metadata) {
    tokenMetadataCache.value.set(mint, {
      ...metadata,
      cachedAt: Date.now()
    })
    
    // Save to localStorage (limit to configured max entries to avoid storage issues)
    try {
      const cacheArray = Array.from(tokenMetadataCache.value.entries())
      const limitedCache = limitCacheEntries(cacheArray, CACHE_CONFIG.MAX_METADATA_ENTRIES)
      setCachedData(STORAGE_KEYS.TOKEN_METADATA, limitedCache)
      setCachedData(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now())
    } catch (err) {
      logDebug('Failed to save metadata cache:', err)
    }
  }
  
  /**
   * Get cached metadata for a token
   * Returns complete token info if cache is valid
   * Only returns cache if we have at least a name (successful fetch)
   * Missing name = failed fetch, so retry on refresh
   */
  function getCachedMetadata(mint) {
    const cached = tokenMetadataCache.value.get(mint)
    if (cached && isCacheValid(cached.cachedAt, CACHE_TTL.METADATA)) {
      // Remove cachedAt before returning
      const { cachedAt, ...metadata } = cached
      
      // Only use cache if we have at least a name (indicates successful fetch)
      // If name is missing, it means the fetch failed, so retry on refresh
      if (metadata.name) {
        // Valid cache - return it (even if symbol/image missing, we have name)
        return {
          ...metadata,
          mint: mint // Ensure mint is included
        }
      } else {
        // Cache has no name = failed fetch, remove it to force retry
        logDebug(`Cache entry for ${mint} has no name, removing to force retry`)
        tokenMetadataCache.value.delete(mint)
        // Also remove from localStorage
        try {
          const cacheArray = Array.from(tokenMetadataCache.value.entries())
          setCachedData(STORAGE_KEYS.TOKEN_METADATA, cacheArray)
        } catch (err) {
          logDebug('Failed to update cache after removing invalid entry:', err)
        }
      }
    }
    return null
  }
  
  /**
   * Get cached token info (complete with decimals)
   * This is the main function to check cache before fetching
   * Only returns cache if we have at least a name (successful fetch)
   */
  function getCachedTokenInfo(mint) {
    return getCachedMetadata(mint)
  }
  
  /**
   * Fetch token info with caching
   * Checks cache first - only fetches if cache is missing, expired, or invalid
   * Only caches successful fetches (has name) - failed fetches are not cached
   */
  async function fetchTokenInfo(mint) {
    // Check cache first - if valid and has name, return immediately
    const cached = getCachedTokenInfo(mint)
    if (cached && cached.name) {
      // Cache hit with valid data! Return cached data (no network call)
      return cached
    }
    
    // Cache miss, expired, or invalid (no name) - fetch fresh data
    const tokenInfo = await tokenRegistry.fetchTokenInfo(mint, getCachedTokenInfo)
    
    // Only cache if we have at least a name (successful fetch)
    // Don't cache failures - this allows retry on refresh
    if (tokenInfo && tokenInfo.name) {
      cacheMetadata(mint, {
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        image: tokenInfo.image,
        decimals: tokenInfo.decimals
      })
    } else {
      // Failed fetch (no name) - don't cache, will retry on next refresh
      logDebug(`Token ${mint} fetch failed (no name), not caching to allow retry`)
    }
    
    return tokenInfo
  }
  
  /**
   * Preload registry (shared across all components)
   * Wrapper for consistent store API
   */
  async function preloadRegistry() {
    return tokenRegistry.preloadRegistry()
  }
  
  /**
   * Search tokens (shared across all components)
   * Wrapper for consistent store API
   */
  async function searchTokens(query) {
    return tokenRegistry.searchTokens(query)
  }
  
  /**
   * Get token balance from wallet balances
   * Wrapper for consistent store API
   */
  function getTokenBalance(mint) {
    return walletBalances.getTokenBalance(mint)
  }
  
  /**
   * Get token info from wallet balances (only for tokens in wallet)
   * For complete token info including metadata, use fetchTokenInfo instead
   * Wrapper for consistent store API
   */
  function getTokenInfo(mint) {
    return walletBalances.getTokenInfo(mint)
  }
  
  /**
   * Fetch all wallet balances (shared across all components)
   * Wrapper for consistent store API
   */
  async function fetchBalances() {
    return walletBalances.fetchBalances()
  }
  
  /**
   * Fetch single token balance (shared across all components)
   * Wrapper for consistent store API
   */
  async function fetchSingleTokenBalance(mint) {
    return walletBalances.fetchSingleTokenBalance(mint)
  }
  
  // Load cached metadata on store initialization
  loadCachedMetadata()
  
  return {
    // State
    balances,
    tokenMetadataCache: computed(() => tokenMetadataCache.value),
    
    // Loading states
    loadingBalances,
    loadingMetadata,
    loadingRegistry,
    
    // Errors
    balancesError,
    registryError,
    
    // Registry
    searchQuery: tokenRegistry.searchQuery,
    searchResults: tokenRegistry.searchResults,
    fetchingTokenInfo: tokenRegistry.fetchingTokenInfo,
    
    // Actions
    fetchTokenInfo,
    preloadRegistry,
    searchTokens,
    getTokenBalance,
    getTokenInfo,
    fetchBalances,
    fetchSingleTokenBalance,
    cacheMetadata,
    getCachedMetadata,
    getCachedTokenInfo
  }
})
