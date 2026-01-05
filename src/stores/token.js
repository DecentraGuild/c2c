/**
 * Token Store
 * Centralized store for token data to prevent duplicate loading
 * Includes localStorage caching for better performance
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useWalletBalances } from '../composables/useWalletBalances'
import { useTokenRegistry } from '../composables/useTokenRegistry'

// LocalStorage keys
const STORAGE_KEYS = {
  TOKEN_METADATA: 'token_metadata_cache',
  CACHE_TIMESTAMP: 'token_cache_timestamp'
}

// Cache TTL: 1 day for metadata
const CACHE_TTL = {
  METADATA: 24 * 60 * 60 * 1000 // 1 day
}

/**
 * Get cached data from localStorage
 */
function getCachedData(key) {
  try {
    const data = localStorage.getItem(key)
    if (data) {
      return JSON.parse(data)
    }
  } catch (err) {
    console.debug('Failed to read cache:', err)
  }
  return null
}

/**
 * Set data in localStorage cache
 */
function setCachedData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.debug('Failed to write cache:', err)
    // If storage is full, clear old cache
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN_METADATA)
      localStorage.setItem(key, JSON.stringify(data))
    } catch (clearErr) {
      console.debug('Failed to clear and write cache:', clearErr)
    }
  }
}

/**
 * Check if cache is still valid
 */
function isCacheValid(timestamp, ttl) {
  if (!timestamp) return false
  return Date.now() - timestamp < ttl
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
      
      if (cached && timestamp && isCacheValid(timestamp, CACHE_TTL.METADATA)) {
        tokenMetadataCache.value = new Map(cached)
        return true
      }
    } catch (err) {
      console.debug('Failed to load cached metadata:', err)
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
    
    // Save to localStorage (limit to last 1000 tokens to avoid storage issues)
    try {
      const cacheArray = Array.from(tokenMetadataCache.value.entries())
      const limitedCache = cacheArray.slice(-1000)
      setCachedData(STORAGE_KEYS.TOKEN_METADATA, limitedCache)
      setCachedData(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now())
    } catch (err) {
      console.debug('Failed to save metadata cache:', err)
    }
  }
  
  /**
   * Get cached metadata for a token
   */
  function getCachedMetadata(mint) {
    const cached = tokenMetadataCache.value.get(mint)
    if (cached && isCacheValid(cached.cachedAt, CACHE_TTL.METADATA)) {
      // Remove cachedAt before returning
      const { cachedAt, ...metadata } = cached
      // Don't return cached data if it has null/empty name and symbol (invalid cache)
      if (metadata.name || metadata.symbol) {
        return metadata
      }
      // If cache has null values, remove it and return null to force fresh fetch
      tokenMetadataCache.value.delete(mint)
    }
    return null
  }
  
  /**
   * Fetch token info with caching
   */
  async function fetchTokenInfo(mint) {
    // Check cache first
    const cached = getCachedMetadata(mint)
    if (cached) {
      return { ...cached, mint }
    }
    
    // Fetch from registry
    const tokenInfo = await tokenRegistry.fetchTokenInfo(mint)
    
    // Only cache if we have at least name or symbol (valid token info)
    if (tokenInfo && (tokenInfo.name || tokenInfo.symbol)) {
      cacheMetadata(mint, {
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        image: tokenInfo.image,
        decimals: tokenInfo.decimals
      })
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
    getCachedMetadata
  }
})
