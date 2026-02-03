/**
 * Storefront Metadata Store
 * Caches NFT metadata and individual mints when a storefront is selected.
 * A storefront can have NFT collections in its collectionMints; loading that storefront
 * loads those collections' metadata and individual mints for offer/request selectors.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchNFTsFromCollection } from '@/composables/useCollectionNFTs'
import { logDebug, logError } from '@/utils/logger'

export const useStorefrontMetadataStore = defineStore('storefrontMetadata', () => {
  const storefrontNFTsCache = ref(new Map())
  const tokenMetadataCache = ref(new Map())

  function getCachedNFTs(storefrontId) {
    const cached = storefrontNFTsCache.value.get(storefrontId)
    return cached?.nfts || []
  }

  function isLoading(storefrontId) {
    const cached = storefrontNFTsCache.value.get(storefrontId)
    return cached?.loading || false
  }

  function getError(storefrontId) {
    const cached = storefrontNFTsCache.value.get(storefrontId)
    return cached?.error || null
  }

  const inFlightPreloads = ref(new Map())

  /**
   * Preload NFTs for all NFT collections in a storefront's collectionMints
   * @param {Object} storefront - Storefront object with collectionMints
   */
  async function preloadStorefrontNFTs(storefront) {
    if (!storefront || !storefront.id) {
      logDebug('Cannot preload: storefront or storefront.id missing')
      return
    }
    const storefrontId = storefront.id
    const collectionMints = storefront.collectionMints || []
    if (storefrontNFTsCache.value.has(storefrontId)) {
      const cached = storefrontNFTsCache.value.get(storefrontId)
      if (cached.nfts.length > 0) {
        logDebug(`Storefront ${storefrontId} NFTs already cached (${cached.nfts.length} NFTs)`)
        return cached.nfts
      }
    }
    if (inFlightPreloads.value.has(storefrontId)) {
      logDebug(`Storefront ${storefrontId} NFTs already preloading, waiting for existing request...`)
      return inFlightPreloads.value.get(storefrontId)
    }
    const nftCollectionMints = collectionMints.filter(
      item => typeof item === 'object' && item.fetchingType === 'NFT'
    )
    if (nftCollectionMints.length === 0) {
      logDebug(`No NFT collections found for storefront ${storefrontId}`)
      storefrontNFTsCache.value.set(storefrontId, { nfts: [], loading: false, error: null })
      return []
    }
    const preloadPromise = (async () => {
      storefrontNFTsCache.value.set(storefrontId, { nfts: [], loading: true, error: null })
      logDebug(`Preloading NFTs for ${nftCollectionMints.length} collections in storefront ${storefrontId}`)
      try {
        const allNFTs = []
        for (const collectionItem of nftCollectionMints) {
          const collectionMint = collectionItem.mint
          try {
            logDebug(`Fetching NFTs for collection mint: ${collectionMint}`)
            const nfts = await fetchNFTsFromCollection(collectionMint)
            const enrichedNFTs = nfts.map(nft => ({
              ...nft,
              collectionMint,
              collectionItem,
              fetchingType: 'NFT',
              isCollectionItem: true,
              image: nft.image || collectionItem.image || null
            }))
            allNFTs.push(...enrichedNFTs)
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
          }
        }
        storefrontNFTsCache.value.set(storefrontId, { nfts: allNFTs, loading: false, error: null })
        logDebug(`Preloaded ${allNFTs.length} total NFTs for storefront ${storefrontId}`)
        return allNFTs
      } catch (err) {
        logError(`Failed to preload storefront NFTs for ${storefrontId}:`, err)
        storefrontNFTsCache.value.set(storefrontId, {
          nfts: [],
          loading: false,
          error: err.message || 'Failed to preload NFTs'
        })
        return []
      } finally {
        inFlightPreloads.value.delete(storefrontId)
      }
    })()
    inFlightPreloads.value.set(storefrontId, preloadPromise)
    return preloadPromise
  }

  function getCachedTokenMetadata(mint) {
    return tokenMetadataCache.value.get(mint) || null
  }

  function clearCache(storefrontId) {
    if (storefrontId) {
      storefrontNFTsCache.value.delete(storefrontId)
    } else {
      storefrontNFTsCache.value.clear()
      tokenMetadataCache.value.clear()
    }
  }

  return {
    getCachedNFTs,
    isLoading,
    getError,
    preloadStorefrontNFTs,
    getCachedTokenMetadata,
    clearCache
  }
})
