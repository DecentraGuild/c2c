/**
 * Collection Store
 * Manages registered NFT collections and their marketplace settings
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { logError, logDebug } from '../utils/logger'
import { useThemeStore } from './theme'
import { filterEscrowsByCollection, filterActiveEscrows } from '../utils/marketplaceHelpers'
import { useCollectionMetadataStore } from './collectionMetadata'

export const useCollectionStore = defineStore('collection', () => {
  // Registered collections (would come from backend API in production)
  const collections = ref([])
  const loadingCollections = ref(false)
  const error = ref(null)

  // Currently selected collection (for marketplace filtering)
  const selectedCollectionId = ref(null)

  /**
   * Collection structure:
   * {
   *   id: string, // Collection mint address or unique ID
   *   name: string,
   *   symbol: string,
   *   description: string,
   *   image: string, // Collection image/logo
   *   collectionMint: string, // Metaplex collection mint address
   *   verification_status: 'community' | 'verified', // 'community' = default, 'verified' = official store
   *   verified: boolean, // DEPRECATED: Use verification_status instead
   *   subscriptionActive: boolean, // Whether $50/month subscription is active
   *   subscriptionExpiresAt: string, // ISO date string
   *   shopFee: {
   *     wallet: string, // Shop wallet address to receive fees
   *     makerFlatFee: number, // Maker flat fee in SOL (optional)
   *     takerFlatFee: number, // Taker flat fee in SOL (optional)
   *     makerPercentFee: number, // Maker percentage fee 0-100 (optional)
   *     takerPercentFee: number, // Taker percentage fee 0-100 (optional)
   *   },
   *   tradeDiscount: {
   *     enabled: boolean, // 90% discount (0.001 SOL per trade)
   *     appliesTo: 'all' // 'all' trades with their NFTs
   *   },
   *   createdAt: string, // ISO date string
   *   updatedAt: string // ISO date string
   * }
   */

  // Computed
  const activeCollections = computed(() => {
    return collections.value.filter(c => c.subscriptionActive)
  })

  const selectedCollection = computed(() => {
    if (!selectedCollectionId.value) return null
    return collections.value.find(c => c.id === selectedCollectionId.value)
  })

  // Actions
  const setCollections = (newCollections) => {
    collections.value = newCollections
  }

  const addCollection = (collection) => {
    const exists = collections.value.find(c => c.id === collection.id)
    if (exists) {
      // Update existing
      const index = collections.value.findIndex(c => c.id === collection.id)
      collections.value[index] = { ...collections.value[index], ...collection }
    } else {
      collections.value.push(collection)
    }
  }

  const removeCollection = (collectionId) => {
    collections.value = collections.value.filter(c => c.id !== collectionId)
  }

  // Track if preloading is in progress to prevent duplicates
  const preloadingCollections = ref(new Set())
  
  const LAST_COLLECTION_STORAGE_KEY = 'c2c_last_collection_id'

  const setSelectedCollection = (collectionId) => {
    selectedCollectionId.value = collectionId
    if (collectionId) {
      try {
        localStorage.setItem(LAST_COLLECTION_STORAGE_KEY, collectionId)
      } catch (e) {
        // Ignore storage errors (private mode, quota)
      }
    }

    // Load theme from collection if available
    // Note: Theme loading is also handled by watcher, but we do it here for immediate effect
    const collection = collections.value.find(c => c.id === collectionId)
    if (collection && collection.colors) {
      loadCollectionTheme(collection)
    } else {
      // Reset to default theme if no collection selected or no colors
      const themeStore = useThemeStore()
      themeStore.resetToDefault()
    }
    
    // Preload collection NFTs when marketplace is selected (only if not already loading)
    if (collection && !preloadingCollections.value.has(collection.id)) {
      const collectionMetadataStore = useCollectionMetadataStore()
      
      // Check if already cached or loading
      if (collectionMetadataStore.isLoading(collection.id)) {
        logDebug(`Collection ${collection.id} NFTs already loading, skipping duplicate preload`)
        return
      }
      
      const cachedNFTs = collectionMetadataStore.getCachedNFTs(collection.id)
      if (cachedNFTs.length > 0) {
        logDebug(`Collection ${collection.id} NFTs already cached (${cachedNFTs.length} NFTs), skipping preload`)
        return
      }
      
      // Mark as preloading
      preloadingCollections.value.add(collection.id)
      
      // Preload in background (don't await - let it happen async)
      collectionMetadataStore.preloadCollectionNFTs(collection)
        .then(() => {
          preloadingCollections.value.delete(collection.id)
        })
        .catch(err => {
          logError('Failed to preload collection NFTs:', err)
          preloadingCollections.value.delete(collection.id)
        })
    }
  }
  
  /**
   * Load theme from collection colors
   */
  const loadCollectionTheme = (collection) => {
    try {
      const themeStore = useThemeStore()
      
      // Build theme object from collection
      const themeData = {
        id: collection.id,
        name: collection.name,
        description: collection.description || `Theme for ${collection.name}`,
        colors: collection.colors,
        branding: {
          logo: collection.logo || '/dguild-logo-p2p.svg',
          name: collection.name,
          shortName: collection.name,
        },
        metadata: {
          source: 'collection',
          collectionId: collection.id,
          loadedAt: new Date().toISOString(),
        }
      }
      
      themeStore.loadTheme(themeData)
      logDebug(`Loaded theme for collection: ${collection.name}`)
    } catch (err) {
      logError('Failed to load collection theme:', err)
    }
  }

  const clearSelectedCollection = () => {
    selectedCollectionId.value = null
  }

  /**
   * Load collections from JSON files
   * In production, this could be replaced with an API call: GET /api/collections
   */
  const loadCollections = async () => {
    loadingCollections.value = true
    error.value = null

    try {
      // Load collections from JSON files
      const collectionFiles = [
        '/Collections/DecentraGuild/decentraguild.json',
        '/Collections/Star Atlas/star-atlas.json',
        '/Collections/Skull & Bones/skull-bones.json',
        '/Collections/Race Protocol/race-protocol.json'
      ]

      const loadedCollections = await Promise.all(
        collectionFiles.map(async (file) => {
          try {
            const response = await fetch(file)
            if (!response.ok) {
              throw new Error(`Failed to load ${file}`)
            }
            return await response.json()
          } catch (err) {
            logError(`Failed to load collection file ${file}:`, err)
            return null
          }
        })
      )

      // Filter out null values (failed loads)
      collections.value = loadedCollections.filter(c => c !== null)

      // Restore last visited storefront when none selected (e.g. direct nav to /create)
      if (!selectedCollectionId.value && collections.value.length > 0) {
        try {
          const lastId = localStorage.getItem(LAST_COLLECTION_STORAGE_KEY)
          if (lastId && collections.value.some(c => c.id === lastId)) {
            setSelectedCollection(lastId)
          }
        } catch (e) {
          // Ignore storage errors
        }
      }

      logDebug(`Loaded ${collections.value.length} collections`)
    } catch (err) {
      logError('Failed to load collections:', err)
      error.value = err.message || 'Failed to load collections'
    } finally {
      loadingCollections.value = false
    }
  }

  /**
   * Register a new collection (would call backend API)
   * POST /api/collections
   * @param {Object} collectionData - Collection data
   * @param {Array} collectionData.collectionMints - Array of collection mint addresses
   * @param {Array} collectionData.allowedCurrencies - Array of allowed currency mint addresses
   * @param {string} collectionData.verification_status - 'community' or 'verified' (defaults to 'community')
   */
  const registerCollection = async (collectionData) => {
    loadingCollections.value = true
    error.value = null

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/collections', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(collectionData)
      // })
      // const newCollection = await response.json()
      // addCollection(newCollection)

      // For now, just add locally for testing
      addCollection({
        ...collectionData,
        id: collectionData.collectionMint || `collection-${Date.now()}`,
        verification_status: collectionData.verification_status || 'community', // Default to community
        subscriptionActive: true, // Assume active for testing
        tradeDiscount: {
          enabled: true, // Community stores get discount by default
          appliesTo: 'all'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      logDebug('Collection registered (local only - awaiting backend)')
    } catch (err) {
      logError('Failed to register collection:', err)
      error.value = err.message || 'Failed to register collection'
      throw err
    } finally {
      loadingCollections.value = false
    }
  }

  /**
   * Upgrade collection to verified status
   * Requires signature from collection update authority
   * POST /api/collections/:id/verify
   * @param {string} collectionId - Collection ID
   * @param {string} signature - Signature from collection update authority
   */
  const upgradeToVerified = async (collectionId, signature) => {
    loadingCollections.value = true
    error.value = null

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/collections/${collectionId}/verify`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ signature })
      // })
      // const updatedCollection = await response.json()
      // const index = collections.value.findIndex(c => c.id === collectionId)
      // if (index !== -1) {
      //   collections.value[index] = updatedCollection
      // }

      // For now, just update locally
      const collection = collections.value.find(c => c.id === collectionId)
      if (collection) {
        collection.verification_status = 'verified'
        collection.updatedAt = new Date().toISOString()
        logDebug(`Collection ${collectionId} upgraded to verified`)
      }

      logDebug('Collection upgraded to verified (local only - awaiting backend)')
    } catch (err) {
      logError('Failed to upgrade collection:', err)
      error.value = err.message || 'Failed to upgrade collection'
      throw err
    } finally {
      loadingCollections.value = false
    }
  }

  /**
   * Check if collection is verified (official store)
   * @param {string|Object} collectionIdOrCollection - Collection ID or collection object
   * @returns {boolean} True if verified
   */
  const isVerified = (collectionIdOrCollection) => {
    const collection = typeof collectionIdOrCollection === 'string'
      ? collections.value.find(c => c.id === collectionIdOrCollection)
      : collectionIdOrCollection
    
    if (!collection) return false
    
    // Support both new verification_status and legacy verified field
    return collection.verification_status === 'verified' || collection.verified === true
  }

  /**
   * Check if collection is community store
   * @param {string|Object} collectionIdOrCollection - Collection ID or collection object
   * @returns {boolean} True if community store
   */
  const isCommunityStore = (collectionIdOrCollection) => {
    const collection = typeof collectionIdOrCollection === 'string'
      ? collections.value.find(c => c.id === collectionIdOrCollection)
      : collectionIdOrCollection
    
    if (!collection) return false
    
    // Default to community if not verified
    return collection.verification_status === 'community' || 
           (collection.verification_status !== 'verified' && !collection.verified)
  }

  /**
   * Check if a collection has active subscription
   */
  const isCollectionActive = (collectionId) => {
    const collection = collections.value.find(c => c.id === collectionId)
    if (!collection) return false
    
    if (!collection.subscriptionActive) return false
    
    // Check if subscription hasn't expired
    if (collection.subscriptionExpiresAt) {
      const expiresAt = new Date(collection.subscriptionExpiresAt)
      return expiresAt > new Date()
    }
    
    return true
  }

  /**
   * Get collection by mint address
   */
  const getCollectionByMint = (mintAddress) => {
    return collections.value.find(c => 
      c.collectionMint === mintAddress || 
      c.id === mintAddress
    )
  }

  /**
   * Check if a token/NFT belongs to a registered collection
   */
  const belongsToCollection = (tokenMint, collectionId) => {
    const collection = collections.value.find(c => c.id === collectionId)
    if (!collection) return false
    
    // This would need to check on-chain if the NFT's collection field matches
    // For now, this is a placeholder
    // In production, we'd check the NFT's Metaplex metadata collection field
    return false
  }

  /**
   * Calculate and update open trades counts for all collections
   * @param {Array} allEscrows - Array of escrows to count (required)
   */
  const refreshOpenTradesCounts = (allEscrows) => {
    try {
      // Validate input
      if (!allEscrows) {
        logError('refreshOpenTradesCounts called without escrows parameter')
        // Reset all counts to 0
        collections.value.forEach(collection => {
          collection.openTradesCount = 0
        })
        return
      }
      
      if (allEscrows.length === 0) {
        // Reset all counts to 0 (no escrows available)
        collections.value.forEach(collection => {
          collection.openTradesCount = 0
        })
        return
      }
      
      // Count escrows per collection (include cached NFT mints so individual NFTs from collection show)
      const escrowsByCollection = new Map()
      const metadataStore = useCollectionMetadataStore()

      collections.value.forEach(collection => {
        const cachedNFTs = metadataStore.getCachedNFTs(collection.id) || []
        const cachedMints = new Set(
          cachedNFTs.map(n => (n?.mint && String(n.mint).toLowerCase()) || null).filter(Boolean)
        )
        const matchedEscrows = filterEscrowsByCollection(allEscrows, collection, {
          cachedCollectionMints: cachedMints
        })
        const activeEscrows = filterActiveEscrows(matchedEscrows)
        escrowsByCollection.set(collection.id, activeEscrows.length)
      })
      
      // Update counts for all collections
      collections.value.forEach(collection => {
        collection.openTradesCount = escrowsByCollection.get(collection.id) || 0
      })
      
      logDebug(`Updated open trades counts for ${collections.value.length} collections`)
    } catch (err) {
      logError('Failed to refresh open trades counts:', err)
      // On error, set all to 0
      collections.value.forEach(collection => {
        collection.openTradesCount = 0
      })
    }
  }
  

  /**
   * Get open trades count for a collection
   * @param {string} collectionId - Collection ID
   * @returns {number} Number of open trades
   */
  const getOpenTradesCount = (collectionId) => {
    const collection = collections.value.find(c => c.id === collectionId)
    if (!collection) return 0
    
    return collection.openTradesCount || 0
  }

  /**
   * Update open trades count for a collection
   * @param {string} collectionId - Collection ID
   * @param {number} count - Number of open trades
   */
  const setOpenTradesCount = (collectionId, count) => {
    const collection = collections.value.find(c => c.id === collectionId)
    if (collection) {
      collection.openTradesCount = count
    }
  }

  // Track last loaded theme to prevent duplicate loading
  let lastLoadedThemeId = null
  
  // Watch for collection changes and load theme
  watch(selectedCollection, (newCollection, oldCollection) => {
    // Only load theme if it actually changed (prevent duplicate loading)
    if (newCollection && newCollection.colors && newCollection.id !== lastLoadedThemeId) {
      loadCollectionTheme(newCollection)
      lastLoadedThemeId = newCollection.id
    } else if (!newCollection && lastLoadedThemeId !== null) {
      // Reset to default theme when no collection selected
      const themeStore = useThemeStore()
      themeStore.resetToDefault()
      lastLoadedThemeId = null
    }
  })

  return {
    // State
    collections,
    loadingCollections,
    error,
    selectedCollectionId,
    
    // Computed
    activeCollections,
    selectedCollection,
    
    // Actions
    setCollections,
    addCollection,
    removeCollection,
    setSelectedCollection,
    clearSelectedCollection,
    loadCollections,
    registerCollection,
    upgradeToVerified,
    isCollectionActive,
    getCollectionByMint,
    belongsToCollection,
    loadCollectionTheme,
    getOpenTradesCount,
    setOpenTradesCount,
    refreshOpenTradesCounts,
    isVerified,
    isCommunityStore
  }
})
