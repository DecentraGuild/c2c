/**
 * Helper functions for working with collections
 */

import { getCollectionCurrencies } from './constants/baseCurrencies'

/**
 * Get all allowed mint addresses for a collection
 * Includes: currencies (baseCurrency + customCurrencies) + collectionMints
 * @param {Object} collection - Collection object
 * @returns {Object} Object with currencyMints, tokenMints, nftCollectionMints, and allMints
 */
export function getAllowedMints(collection) {
  if (!collection) {
    return {
      currencyMints: [],
      tokenMints: [],
      nftCollectionMints: [],
      allMints: []
    }
  }

  const collectionMints = collection.collectionMints || []
  
  // Get allowed currencies from baseCurrency and customCurrencies
  const collectionCurrencies = getCollectionCurrencies(collection)
  const currencyMints = collectionCurrencies.map(c => c.mint)
  
  // Separate token and NFT collection mints
  const tokenCollectionMints = collectionMints
    .filter(item => {
      // Include string mints or objects that are NOT NFTs
      if (typeof item === 'string') return true
      return typeof item === 'object' && item.fetchingType !== 'NFT'
    })
    .map(item => typeof item === 'string' ? item : item.mint)
  
  const nftCollectionMints = collectionMints
    .filter(item => typeof item === 'object' && item.fetchingType === 'NFT')
    .map(item => item.mint)
  
  // Combine all allowed mints
  const allMints = [...currencyMints, ...tokenCollectionMints, ...nftCollectionMints]
  
  return {
    currencyMints,
    tokenMints: tokenCollectionMints,
    nftCollectionMints,
    allMints
  }
}

/**
 * Check if a mint address is allowed for a collection
 * @param {string} mintAddress - Mint address to check
 * @param {Object} collection - Collection object
 * @returns {boolean} True if mint is allowed
 */
export function isMintAllowed(mintAddress, collection) {
  if (!collection || !mintAddress) return false
  const { allMints } = getAllowedMints(collection)
  return allMints.includes(mintAddress)
}

/**
 * Filter storefronts by search query (name, description, and optionally id)
 * @param {Array} storefronts - Array of storefront objects
 * @param {string} query - Search query (trimmed; empty returns all)
 * @param {Object} options - Options
 * @param {boolean} options.includeId - If true, also match storefront.id (default: false for selectors, true for dashboard)
 * @returns {Array} Filtered storefronts
 */
export function filterStorefrontsByQuery(storefronts, query, { includeId = false } = {}) {
  return filterCollectionsByQuery(storefronts, query, { includeId })
}

/**
 * Filter collections/storefronts by search query (legacy name)
 * @param {Array} collections - Array of storefront/collection objects
 * @param {string} query - Search query (trimmed; empty returns all)
 * @param {Object} options - Options
 * @param {boolean} options.includeId - If true, also match collection.id (default: false for selectors, true for dashboard)
 * @returns {Array} Filtered collections
 */
export function filterCollectionsByQuery(collections, query, { includeId = false } = {}) {
  if (!collections || !Array.isArray(collections)) return []
  const trimmed = (query || '').trim()
  if (!trimmed) return collections
  const lower = trimmed.toLowerCase()
  return collections.filter(collection => {
    const nameMatch = collection.name?.toLowerCase().includes(lower)
    const descriptionMatch = collection.description?.toLowerCase().includes(lower)
    const idMatch = includeId && collection.id?.toLowerCase().includes(lower)
    return nameMatch || descriptionMatch || idMatch
  })
}
