/**
 * Composable for retrieving collection item metadata
 * Centralizes logic for getting metadata from collection mints
 */

import { computed } from 'vue'

/**
 * Get collection item metadata by mint address
 * @param {Object} collection - Collection object with collectionMints array
 * @param {string} mintAddress - Token/NFT mint address
 * @returns {Object|null} Collection item metadata or null
 */
export function getCollectionItemMetadata(collection, mintAddress) {
  if (!collection || !mintAddress) return null
  
  const collectionMints = collection.collectionMints || []
  if (Array.isArray(collectionMints) && collectionMints.length > 0) {
    // Check if it's an array of objects (new format) or strings (old format)
    if (typeof collectionMints[0] === 'object' && collectionMints[0].mint) {
      return collectionMints.find(item => item.mint === mintAddress) || null
    } else if (typeof collectionMints[0] === 'string') {
      // Old format - just check if mint exists
      return collectionMints.includes(mintAddress) ? { mint: mintAddress, fetchingType: 'Token' } : null
    }
  }
  return null
}

/**
 * Get fetching type for a collection item
 * @param {Object} collection - Collection object with collectionMints array
 * @param {string} mintAddress - Token/NFT mint address
 * @returns {string|null} 'Token', 'NFT', or null if not found
 */
export function getCollectionItemFetchingType(collection, mintAddress) {
  const metadata = getCollectionItemMetadata(collection, mintAddress)
  if (!metadata) return null
  
  return metadata.fetchingType || 'Token' // Default to Token if not specified
}

/**
 * Get item metadata for an escrow (from deposit or request token)
 * @param {Object} collection - Collection object
 * @param {Object} escrow - Escrow object with depositToken and requestToken
 * @returns {Object|null} Collection item metadata or null
 */
export function getEscrowItemMetadata(collection, escrow) {
  if (!escrow || !escrow.depositToken || !escrow.requestToken) return null
  
  const depositMint = escrow.depositToken.mint
  const requestMint = escrow.requestToken.mint
  
  // Check deposit token first
  const depositMetadata = getCollectionItemMetadata(collection, depositMint)
  if (depositMetadata) return depositMetadata
  
  // Check request token
  const requestMetadata = getCollectionItemMetadata(collection, requestMint)
  if (requestMetadata) return requestMetadata
  
  return null
}

/**
 * Composable for collection metadata operations
 * @param {Object} collection - Collection object (can be reactive)
 * @returns {Object} Metadata helper functions
 */
export function useCollectionMetadata(collection) {
  const getMetadata = (mintAddress) => {
    return computed(() => getCollectionItemMetadata(collection.value, mintAddress))
  }

  const getEscrowMetadata = (escrow) => {
    return computed(() => getEscrowItemMetadata(collection.value, escrow.value))
  }

  const getTokenDisplayName = (token) => {
    if (!token) return 'Unknown'
    
    // First check if it's a collection item with metadata
    const metadata = getCollectionItemMetadata(collection.value, token.mint)
    if (metadata && metadata.name) {
      return metadata.name
    }
    
    // Fallback to token name or symbol
    return token.name || token.symbol || 'Unknown'
  }

  const getTokenImage = (token) => {
    if (!token) return null
    
    // First check if it's a collection item with metadata
    const metadata = getCollectionItemMetadata(collection.value, token.mint)
    if (metadata && metadata.image) {
      return metadata.image
    }
    
    // Fallback to token image
    return token.image || null
  }

  /**
   * Get seller fee basis points for a mint address
   * @param {string} mintAddress - Token/NFT mint address
   * @returns {number} Seller fee basis points (0-10000) or 0 if not found
   */
  const getSellerFeeBasisPoints = (mintAddress) => {
    const metadata = getCollectionItemMetadata(collection.value, mintAddress)
    if (!metadata) return 0
    return metadata.sellerFeeBasisPoints || 0
  }

  /**
   * Get royalty fee percentage for a mint address
   * @param {string} mintAddress - Token/NFT mint address
   * @returns {number} Royalty fee percentage (0-100) or 0 if not found
   */
  const getRoyaltyFeePercentage = (mintAddress) => {
    const basisPoints = getSellerFeeBasisPoints(mintAddress)
    return basisPoints / 100 // Convert basis points to percentage (700 = 7%)
  }

  /**
   * Get maximum royalty fee from all collection mints
   * @returns {number} Maximum royalty fee percentage (0-100)
   */
  const getMaxRoyaltyFeePercentage = () => {
    const coll = collection.value
    if (!coll || !coll.collectionMints) return 0
    
    const collectionMints = coll.collectionMints || []
    if (collectionMints.length === 0) return 0
    
    let maxFee = 0
    
    collectionMints.forEach(item => {
      if (typeof item === 'object' && item.mint) {
        // New format: object with mint and sellerFeeBasisPoints
        const fee = item.sellerFeeBasisPoints || 0
        const percentage = fee / 100 // Convert basis points to percentage
        if (percentage > maxFee) {
          maxFee = percentage
        }
      } else if (typeof item === 'string') {
        // Old format: just mint address string
        const fee = getSellerFeeBasisPoints(item)
        const percentage = fee / 100
        if (percentage > maxFee) {
          maxFee = percentage
        }
      }
    })
    
    return maxFee
  }

  return {
    getCollectionItemMetadata: (mintAddress) => getCollectionItemMetadata(collection.value, mintAddress),
    getEscrowItemMetadata: (escrow) => getEscrowItemMetadata(collection.value, escrow),
    getTokenDisplayName,
    getTokenImage,
    getSellerFeeBasisPoints,
    getRoyaltyFeePercentage,
    getMaxRoyaltyFeePercentage
  }
}
