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
