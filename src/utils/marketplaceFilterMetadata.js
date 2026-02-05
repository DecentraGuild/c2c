/**
 * Marketplace filter metadata: resolve a mint to filter dimensions (itemType, class, collectionId)
 * Used for building filter options and applying filters from both deposit and request sides.
 */

import { getCollectionItemMetadata } from '@/composables/useCollectionMetadata'

/**
 * Get filter metadata for a mint in storefront context.
 * Resolves: collectionMints entry, cached NFT (collectionItem), or shop currency.
 *
 * @param {Object} storefront - Storefront object with collectionMints, baseCurrency, customCurrencies
 * @param {string} mint - Token/NFT mint address
 * @param {{ cachedNFTs?: Array, shopCurrencies?: Array }} options - cachedNFTs from getCachedNFTs(storefront.id); shopCurrencies from getCollectionCurrencies(storefront)
 * @returns {{ itemType: string, class: string, collectionId?: string, name?: string, ... }|null}
 */
export function getMetadataForMint(storefront, mint, { cachedNFTs = [], shopCurrencies = [] } = {}) {
  if (!storefront || !mint) return null

  // 1. collectionMints: direct entry
  const collectionMeta = getCollectionItemMetadata(storefront, mint)
  if (collectionMeta) {
    const itemType = collectionMeta.itemType || 'unknown'
    const classValue = collectionMeta.class || 'unknown'
    const collectionId =
      collectionMeta.fetchingType === 'NFT' ? (collectionMeta.mint || undefined) : undefined
    return {
      ...collectionMeta,
      itemType,
      class: classValue,
      collectionId,
      name: collectionMeta.name
    }
  }

  // 2. Cached NFT: individual NFT from storefront collection
  if (cachedNFTs && cachedNFTs.length > 0) {
    const nft = cachedNFTs.find(n => n?.mint === mint)
    if (nft?.collectionItem) {
      const ci = nft.collectionItem
      return {
        itemType: ci.itemType || 'unknown',
        class: ci.class || 'unknown',
        collectionId: nft.collectionMint || undefined,
        name: nft.name || ci.name,
        ...ci
      }
    }
  }

  // 3. Shop currency (baseCurrency + customCurrencies)
  if (shopCurrencies && shopCurrencies.length > 0) {
    const c = shopCurrencies.find(c => c?.mint === mint)
    if (c) {
      const classValue = c.symbol || c.name || 'Unknown'
      return {
        itemType: 'currency',
        class: classValue,
        name: c.name || c.symbol,
        mint: c.mint
      }
    }
  }

  return null
}
