/**
 * Collection Metadata Store
 * Caches collection NFTs and metadata when a marketplace is selected
 * This allows both offer and request selectors to use preloaded data
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchNFTsFromCollection } from '../composables/useCollectionNFTs'
import { logDebug, logError } from '../utils/logger'

export const useCollectionMetadataStore = defineStore('collectionMetadata', () => {
  // Cache: collectionId -> { nfts: [], loading: boolean, error: string }
  const collectionNFTsCache = ref(new Map())
  
  // Cache: mint -> token metadata (for images, names, etc.)
  const tokenMetadataCache = ref(new Map())
  
  /**
   * Get cached NFTs for a collection
   * @param {string} collectionId - Collection ID
   * @returns {Array} Cached NFTs array or empty array
   */
  function getCachedNFTs(collectionId) {
    const cached = collectionNFTsCache.value.get(collectionId)
    return cached?.nfts || []
  }
  
  /**
   * Check if collection NFTs are loading
   * @param {string} collectionId - Collection ID
   * @returns {boolean} True if loading
   */
  function isLoading(collectionId) {
    const cached = collectionNFTsCache.value.get(collectionId)
    return cached?.loading || false
  }
  
  /**
   * Get error for a collection
   * @param {string} collectionId - Collection ID
   * @returns {string|null} Error message or null
   */
  function getError(collectionId) {
    const cached = collectionNFTsCache.value.get(collectionId)
    return cached?.error || null
  }
  
  // Track in-flight preload requests to prevent duplicates
  const inFlightPreloads = ref(new Map())
  
  /**
   * Preload NFTs for all NFT collections in a marketplace
   * @param {Object} collection - Collection object with collectionMints
   */
  async function preloadCollectionNFTs(collection) {
    if (!collection || !collection.id) {
      logDebug('Cannot preload: collection or collection.id missing')
      return
    }
    
    const collectionId = collection.id
    const collectionMints = collection.collectionMints || []
    
    // Check if already cached
    if (collectionNFTsCache.value.has(collectionId)) {
      const cached = collectionNFTsCache.value.get(collectionId)
      if (cached.nfts.length > 0) {
        logDebug(`Collection ${collectionId} NFTs already cached (${cached.nfts.length} NFTs)`)
        return cached.nfts
      }
    }
    
    // Check if already loading (prevent duplicate preloads)
    if (inFlightPreloads.value.has(collectionId)) {
      logDebug(`Collection ${collectionId} NFTs already preloading, waiting for existing request...`)
      return inFlightPreloads.value.get(collectionId)
    }
    
    // Find NFT collection mints (fetchingType === 'NFT')
    const nftCollectionMints = collectionMints.filter(
      item => typeof item === 'object' && item.fetchingType === 'NFT'
    )
    
    if (nftCollectionMints.length === 0) {
      logDebug(`No NFT collections found for ${collectionId}`)
      collectionNFTsCache.value.set(collectionId, {
        nfts: [],
        loading: false,
        error: null
      })
      return []
    }
    
    // Create promise for this preload and track it
    const preloadPromise = (async () => {
      // Set loading state
      collectionNFTsCache.value.set(collectionId, {
        nfts: [],
        loading: true,
        error: null
      })
      
      logDebug(`Preloading NFTs for ${nftCollectionMints.length} collections in ${collectionId}`)
      
      try {
      const allNFTs = []
      
      // Fetch NFTs for each NFT collection mint
      for (const collectionItem of nftCollectionMints) {
        const collectionMint = collectionItem.mint
        
        try {
          logDebug(`Fetching NFTs for collection mint: ${collectionMint}`)
          
          // Fetch NFTs from collection using the collection mint
          const nfts = await fetchNFTsFromCollection(collectionMint)
          
          // Enrich NFTs with collection item metadata
          const enrichedNFTs = nfts.map(nft => ({
            ...nft,
            collectionMint: collectionMint,
            collectionItem: collectionItem,
            fetchingType: 'NFT',
            isCollectionItem: true,
            // Ensure we have the image from collection item if NFT doesn't have one
            image: nft.image || collectionItem.image || null
          }))
          
          allNFTs.push(...enrichedNFTs)
          
          // Cache token metadata for images
          enrichedNFTs.forEach(nft => {
            if (nft.mint && (nft.name || nft.image)) {
              tokenMetadataCache.value.set(nft.mint, {
                name: nft.name || collectionItem.name || '',
                symbol: nft.symbol || '',
                image: nft.image || collectionItem.image || null,
                collection: nft.collection || collectionMint
              })
            }
          })
          
          logDebug(`Fetched ${nfts.length} NFTs for collection ${collectionMint}`)
        } catch (err) {
          logError(`Failed to fetch NFTs for collection ${collectionMint}:`, err)
          // Continue with other collections
        }
      }
      
      // Update cache
      collectionNFTsCache.value.set(collectionId, {
        nfts: allNFTs,
        loading: false,
        error: null
      })
      
        logDebug(`Preloaded ${allNFTs.length} total NFTs for collection ${collectionId}`)
        return allNFTs
      } catch (err) {
        logError(`Failed to preload collection NFTs for ${collectionId}:`, err)
        collectionNFTsCache.value.set(collectionId, {
          nfts: [],
          loading: false,
          error: err.message || 'Failed to preload NFTs'
        })
        return []
      } finally {
        // Remove from in-flight tracking
        inFlightPreloads.value.delete(collectionId)
      }
    })()
    
    // Track the promise
    inFlightPreloads.value.set(collectionId, preloadPromise)
    
    return preloadPromise
  }
  
  /**
   * Get cached token metadata
   * @param {string} mint - Token mint address
   * @returns {Object|null} Cached metadata or null
   */
  function getCachedTokenMetadata(mint) {
    return tokenMetadataCache.value.get(mint) || null
  }
  
  /**
   * Clear cache for a collection
   * @param {string} collectionId - Collection ID
   */
  function clearCache(collectionId) {
    if (collectionId) {
      collectionNFTsCache.value.delete(collectionId)
    } else {
      // Clear all
      collectionNFTsCache.value.clear()
      tokenMetadataCache.value.clear()
    }
  }
  
  return {
    getCachedNFTs,
    isLoading,
    getError,
    preloadCollectionNFTs,
    getCachedTokenMetadata,
    clearCache
  }
})
