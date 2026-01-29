/**
 * Composable for marketplace filtering logic
 * Centralizes filtering operations for better performance and reusability
 */

import { computed, ref, watch } from 'vue'
import { simpleDebounce } from '../utils/debounce'
import {
  filterEscrowsByCollection,
  filterEscrowsByTradeType,
  filterActiveEscrows,
  sortEscrowsByUserBalance,
  canUserFillEscrow
} from '../utils/marketplaceHelpers'
import { getEscrowItemMetadata } from './useCollectionMetadata'

/**
 * Create a debounced ref that updates after delay
 */
function useDebouncedRef(sourceRef, delay = 300) {
  const debouncedValue = ref(sourceRef.value)
  
  const updateDebounced = simpleDebounce((value) => {
    debouncedValue.value = value
  }, delay)
  
  watch(sourceRef, (newValue) => {
    updateDebounced(newValue)
  }, { immediate: true })
  
  return debouncedValue
}

/**
 * Composable for marketplace filtering
 * @param {Object} options - Configuration options
 * @param {Ref} options.allEscrows - All escrows to filter
 * @param {Ref} options.selectedCollection - Currently selected collection
 * @param {Ref} options.selectedTradeType - Selected trade type filter
 * @param {Ref} options.userBalances - User token balances map
 * @param {Ref} options.activeFilters - Active itemType/class filters
 * @param {Ref} options.searchQuery - Search query string
 * @returns {Object} Filtered escrows and helper functions
 */
export function useMarketplaceFilters({
  allEscrows,
  selectedCollection,
  selectedTradeType,
  userBalances,
  activeFilters,
  searchQuery
}) {
  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebouncedRef(searchQuery, 300)

  // Step 1: Filter by collection and active status
  const collectionFilteredEscrows = computed(() => {
    if (!selectedCollection.value || !allEscrows.value || allEscrows.value.length === 0) {
      return []
    }
    
    let filtered = filterEscrowsByCollection(allEscrows.value, selectedCollection.value)
    filtered = filterActiveEscrows(filtered)
    return filtered
  })

  // Step 2: Filter by trade type
  const tradeTypeFilteredEscrows = computed(() => {
    if (!selectedCollection.value || collectionFilteredEscrows.value.length === 0) {
      return []
    }
    
    return filterEscrowsByTradeType(
      collectionFilteredEscrows.value,
      selectedTradeType.value,
      selectedCollection.value
    )
  })

  // Step 3: Filter by itemType/class filters
  const itemTypeFilteredEscrows = computed(() => {
    if (!selectedCollection.value || tradeTypeFilteredEscrows.value.length === 0) {
      return []
    }
    
    if (!activeFilters.value || activeFilters.value.size === 0) {
      return tradeTypeFilteredEscrows.value
    }
    
    return tradeTypeFilteredEscrows.value.filter(escrow => {
      const metadata = getEscrowItemMetadata(selectedCollection.value, escrow)
      if (!metadata) return false
      
      const itemType = metadata.itemType || 'unknown'
      const classValue = metadata.class || 'unknown'
      const filterKey = `${itemType}:${classValue}`
      
      return activeFilters.value.has(filterKey)
    })
  })

  // Step 4: Filter by search query (debounced) - search at escrow/order level
  const searchFilteredEscrows = computed(() => {
    if (!selectedCollection.value || itemTypeFilteredEscrows.value.length === 0) {
      return []
    }
    
    const query = debouncedSearchQuery.value?.trim()
    if (!query) {
      return itemTypeFilteredEscrows.value
    }
    
    const lowerQuery = query.toLowerCase()
    return itemTypeFilteredEscrows.value.filter(escrow => {
      // Search escrow ID (public key)
      const escrowId = escrow.id?.toLowerCase() || ''
      if (escrowId.includes(lowerQuery)) return true
      
      // Search maker address
      const maker = escrow.maker?.toLowerCase() || ''
      if (maker.includes(lowerQuery)) return true
      
      // Search deposit token fields
      const depositTokenName = escrow.depositToken?.name?.toLowerCase() || ''
      const depositTokenSymbol = escrow.depositToken?.symbol?.toLowerCase() || ''
      const depositTokenMint = escrow.depositToken?.mint?.toLowerCase() || ''
      if (
        depositTokenName.includes(lowerQuery) ||
        depositTokenSymbol.includes(lowerQuery) ||
        depositTokenMint.includes(lowerQuery)
      ) return true
      
      // Search request token fields
      const requestTokenName = escrow.requestToken?.name?.toLowerCase() || ''
      const requestTokenSymbol = escrow.requestToken?.symbol?.toLowerCase() || ''
      const requestTokenMint = escrow.requestToken?.mint?.toLowerCase() || ''
      if (
        requestTokenName.includes(lowerQuery) ||
        requestTokenSymbol.includes(lowerQuery) ||
        requestTokenMint.includes(lowerQuery)
      ) return true
      
      // Also search collection metadata if available (for NFT names)
      const depositMetadata = getEscrowItemMetadata(selectedCollection.value, {
        depositToken: escrow.depositToken,
        requestToken: escrow.requestToken
      })
      const requestMetadata = getEscrowItemMetadata(selectedCollection.value, escrow)
      
      if (depositMetadata?.name?.toLowerCase().includes(lowerQuery)) return true
      if (requestMetadata?.name?.toLowerCase().includes(lowerQuery)) return true
      
      return false
    })
  })

  // Step 5: Sort by user balance (fillable trades first)
  const sortedEscrows = computed(() => {
    if (!searchFilteredEscrows.value || searchFilteredEscrows.value.length === 0) {
      return []
    }
    
    return sortEscrowsByUserBalance(
      searchFilteredEscrows.value,
      userBalances.value || {}
    )
  })

  // Split into user fillable and others
  const userFillableEscrows = computed(() => {
    return sortedEscrows.value.filter(escrow => 
      canUserFillEscrow(escrow, userBalances.value || {})
    )
  })

  const otherEscrows = computed(() => {
    return sortedEscrows.value.filter(escrow => 
      !canUserFillEscrow(escrow, userBalances.value || {})
    )
  })

  return {
    filteredEscrows: sortedEscrows,
    userFillableEscrows,
    otherEscrows,
    debouncedSearchQuery
  }
}
