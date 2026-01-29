/**
 * Collection Display Composable
 * Centralizes collection display logic for CollectionCard and CollectionListItem
 * Extracts duplicate code for fees, royalties, currencies, and collection mints
 */

import { computed } from 'vue'
import { useCollectionMetadata } from './useCollectionMetadata'
import { getCollectionCurrencies } from '../utils/constants/baseCurrencies'
import { FEE_CONFIG, TRANSACTION_COSTS } from '../utils/constants/fees'

/**
 * Composable for collection display logic
 * @param {Ref<Object>} collection - Reactive collection object
 * @returns {Object} Display helpers and computed properties
 */
export function useCollectionDisplay(collection) {
  // Get collection metadata composable
  const collectionMetadata = useCollectionMetadata(collection)

  /**
   * Calculate maker fee (platform + shop fee if applicable)
   * @returns {string} Formatted fee amount in SOL
   */
  const getMakerFee = () => {
    // Base platform fee from constants
    const platformFee = TRANSACTION_COSTS.PLATFORM_MAKER_FEE
    
    // If shop fee is configured, add it
    if (collection.value?.shopFee?.wallet) {
      const shopFee = collection.value.shopFee.makerFlatFee || 0
      const totalFee = platformFee + shopFee
      return totalFee.toFixed(4).replace(/\.?0+$/, '') // Remove trailing zeros
    }
    
    // No shop fee: base platform fee only
    return platformFee.toFixed(4).replace(/\.?0+$/, '')
  }

  /**
   * Calculate taker fee (platform + shop fee if applicable)
   * @returns {string} Formatted fee amount in SOL
   */
  const getTakerFee = () => {
    // Base platform fee from constants
    const platformFee = TRANSACTION_COSTS.PLATFORM_TAKER_FEE
    
    // If shop fee is configured, add it
    if (collection.value?.shopFee?.wallet) {
      const shopFee = collection.value.shopFee.takerFlatFee || 0
      const totalFee = platformFee + shopFee
      return totalFee.toFixed(6).replace(/\.?0+$/, '')
    }
    
    // No shop fee: base platform fee only
    return platformFee.toFixed(6).replace(/\.?0+$/, '')
  }

  /**
   * Get shop fee display string
   * @returns {string} Formatted shop fee display
   */
  const getShopFeeDisplay = () => {
    const shopFee = collection.value?.shopFee
    if (!shopFee) return 'None'
    
    const parts = []
    if (shopFee.makerFlatFee > 0 || shopFee.takerFlatFee > 0) {
      parts.push(`${shopFee.makerFlatFee || 0}/${shopFee.takerFlatFee || 0} SOL`)
    }
    if (shopFee.makerPercentFee > 0 || shopFee.takerPercentFee > 0) {
      parts.push(`${shopFee.makerPercentFee || 0}/${shopFee.takerPercentFee || 0}%`)
    }
    
    return parts.length > 0 ? parts.join(' + ') : 'None'
  }

  /**
   * Get collection mints with royalty info, sorted by category
   * Handles both old format (array of strings) and new format (array of objects)
   */
  const collectionMintsList = computed(() => {
    const mints = collection.value?.collectionMints || []
    const mapped = mints.map(item => {
      if (typeof item === 'string') {
        // Old format: just mint address
        return {
          mint: item,
          name: null,
          royalty: 0,
          category: null
        }
      } else {
        // New format: object with metadata
        const basisPoints = item.sellerFeeBasisPoints || 0
        return {
          mint: item.mint,
          name: item.name || null,
          royalty: basisPoints / 100, // Convert to percentage
          category: item.category || item.itemType || null
        }
      }
    })
    
    // Sort by category, then by name
    return mapped.sort((a, b) => {
      const categoryA = (a.category || '').toLowerCase()
      const categoryB = (b.category || '').toLowerCase()
      
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB)
      }
      
      // If same category, sort by name
      const nameA = (a.name || '').toLowerCase()
      const nameB = (b.name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
  })

  /**
   * Get maximum royalty from collection mints
   */
  const maxRoyalty = computed(() => {
    if (collectionMintsList.value.length === 0) return 0
    return Math.max(...collectionMintsList.value.map(item => item.royalty || 0))
  })

  /**
   * Get accepted currencies with names (using helper function)
   */
  const acceptedCurrencies = computed(() => {
    return getCollectionCurrencies(collection.value)
  })

  /**
   * Calculate maximum royalty fee from all collection mints
   * Uses collectionMetadata composable for consistency
   */
  const royaltyFeePercentage = computed(() => {
    return collectionMetadata.getMaxRoyaltyFeePercentage()
  })

  /**
   * Format royalty fee for display
   */
  const formatRoyaltyFee = () => {
    if (royaltyFeePercentage.value === 0) return '0%'
    return `${royaltyFeePercentage.value.toFixed(2)}%`
  }

  return {
    // Fee calculation functions
    getMakerFee,
    getTakerFee,
    getShopFeeDisplay,
    
    // Collection data computed properties
    collectionMintsList,
    maxRoyalty,
    acceptedCurrencies,
    royaltyFeePercentage,
    
    // Formatting helpers
    formatRoyaltyFee,
    
    // Re-export collection metadata helpers
    getTokenDisplayName: collectionMetadata.getTokenDisplayName,
    getTokenImage: collectionMetadata.getTokenImage,
    getMaxRoyaltyFeePercentage: collectionMetadata.getMaxRoyaltyFeePercentage
  }
}
