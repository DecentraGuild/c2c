/**
 * Composable for marketplace filtering logic
 * Centralizes filtering operations for better performance and reusability
 */

import { computed, ref, watch } from 'vue'
import { DEBOUNCE_DELAYS } from '../utils/constants'
import { simpleDebounce } from '../utils/debounce'
import {
  filterEscrowsByCollection,
  filterEscrowsByTradeType,
  filterActiveEscrows,
  sortEscrowsByUserBalance,
  canUserFillEscrow,
  belongsToCollection
} from '../utils/marketplaceHelpers'
import { getEscrowItemMetadata } from './useCollectionMetadata'

/**
 * Composable for marketplace filtering - optimized single-pass filtering
 * @param {Object} options - Configuration options
 * @param {import('vue').Ref<Array>} options.allEscrows - All escrows to filter
 * @param {import('vue').Ref<Object>} options.selectedCollection - Currently selected collection
 * @param {import('vue').Ref<string>} options.selectedTradeType - Selected trade type filter ('all'|'nft-to-token'|'token-to-nft'|'nft-to-nft')
 * @param {import('vue').Ref<Object>} options.userBalances - User token balances map (mint -> balance)
 * @param {import('vue').Ref<Set>} options.activeFilters - Active itemType/class filters (Set of 'itemType:class' strings)
 * @param {import('vue').Ref<string>} options.searchQuery - Search query string
 * @returns {{filteredEscrows: import('vue').ComputedRef<Array>, userFillableEscrows: import('vue').ComputedRef<Array>, otherEscrows: import('vue').ComputedRef<Array>, debouncedSearchQuery: import('vue').Ref<string>}} Filtered escrows and helper functions
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
  const debouncedSearchQuery = ref(searchQuery.value)
  
  const updateDebouncedSearch = simpleDebounce((value) => {
    debouncedSearchQuery.value = value
  }, DEBOUNCE_DELAYS.MEDIUM)
  
  watch(searchQuery, (newValue) => {
    updateDebouncedSearch(newValue)
  }, { immediate: true })

  /**
   * Combined filtering logic - single pass for better performance
   * Applies all filters (collection, trade type, itemType/class, search) in one iteration
   */
  const filteredAndSortedEscrows = computed(() => {
    // Early return if no collection or escrows
    if (!selectedCollection.value || !allEscrows.value || allEscrows.value.length === 0) {
      return []
    }
    
    const query = debouncedSearchQuery.value?.trim()
    const lowerQuery = query ? query.toLowerCase() : null
    const hasActiveFilters = activeFilters.value && activeFilters.value.size > 0
    
    // Single pass filter - combines all filter conditions
    const filtered = allEscrows.value.filter(escrow => {
      // Filter 1: Collection match (using helper function logic)
      const depositMint = escrow.depositToken?.mint
      const requestMint = escrow.requestToken?.mint
      const collectionMints = selectedCollection.value.collectionMints || []
      
      const isDepositInCollection = depositMint && belongsToCollection(depositMint, collectionMints)
      const isRequestInCollection = requestMint && belongsToCollection(requestMint, collectionMints)
      
      if (!isDepositInCollection && !isRequestInCollection) {
        return false
      }
      
      // Filter 2: Active status (not closed/expired) and has remaining deposit
      if (escrow.status === 'closed' || escrow.depositRemaining <= 0) {
        return false
      }
      
      // Filter 3: Trade type
      const tradeType = selectedTradeType.value
      if (tradeType !== 'all') {
        const isDepositNFT = isDepositInCollection
        const isRequestNFT = isRequestInCollection
        
        // Buy: currency -> NFT (deposit is currency, request is NFT)
        if (tradeType === 'buy' && (isDepositNFT || !isRequestNFT)) {
          return false
        }
        // Sell: NFT -> currency (deposit is NFT, request is currency)
        if (tradeType === 'sell' && (!isDepositNFT || isRequestNFT)) {
          return false
        }
        // Trade: NFT -> NFT (both deposit and request are NFTs)
        if (tradeType === 'trade' && (!isDepositNFT || !isRequestNFT)) {
          return false
        }
      }
      
      // Filter 4: ItemType/class filters
      if (hasActiveFilters) {
        const metadata = getEscrowItemMetadata(selectedCollection.value, escrow)
        if (!metadata) return false
        
        const itemType = metadata.itemType || 'unknown'
        const classValue = metadata.class || 'unknown'
        const filterKey = `${itemType}:${classValue}`
        
        if (!activeFilters.value.has(filterKey)) {
          return false
        }
      }
      
      // Filter 5: Search query
      if (lowerQuery) {
        const escrowId = escrow.id?.toLowerCase() || ''
        const maker = escrow.maker?.toLowerCase() || ''
        const depositTokenName = escrow.depositToken?.name?.toLowerCase() || ''
        const depositTokenSymbol = escrow.depositToken?.symbol?.toLowerCase() || ''
        const depositTokenMint = escrow.depositToken?.mint?.toLowerCase() || ''
        const requestTokenName = escrow.requestToken?.name?.toLowerCase() || ''
        const requestTokenSymbol = escrow.requestToken?.symbol?.toLowerCase() || ''
        const requestTokenMint = escrow.requestToken?.mint?.toLowerCase() || ''
        
        // Quick text search
        const matchesText = 
          escrowId.includes(lowerQuery) ||
          maker.includes(lowerQuery) ||
          depositTokenName.includes(lowerQuery) ||
          depositTokenSymbol.includes(lowerQuery) ||
          depositTokenMint.includes(lowerQuery) ||
          requestTokenName.includes(lowerQuery) ||
          requestTokenSymbol.includes(lowerQuery) ||
          requestTokenMint.includes(lowerQuery)
        
        if (matchesText) {
          return true
        }
        
        // Check collection metadata (more expensive, only if text search fails)
        const depositMetadata = getEscrowItemMetadata(selectedCollection.value, {
          depositToken: escrow.depositToken,
          requestToken: escrow.requestToken
        })
        const requestMetadata = getEscrowItemMetadata(selectedCollection.value, escrow)
        
        const matchesMetadata = 
          depositMetadata?.name?.toLowerCase().includes(lowerQuery) ||
          requestMetadata?.name?.toLowerCase().includes(lowerQuery)
        
        if (!matchesMetadata) {
          return false
        }
      }
      
      return true
    })
    
    // Sort by user balance (fillable trades first)
    return sortEscrowsByUserBalance(filtered, userBalances.value || {})
  })

  // Split into user fillable and others
  const userFillableEscrows = computed(() => {
    return filteredAndSortedEscrows.value.filter(escrow => 
      canUserFillEscrow(escrow, userBalances.value || {})
    )
  })

  const otherEscrows = computed(() => {
    return filteredAndSortedEscrows.value.filter(escrow => 
      !canUserFillEscrow(escrow, userBalances.value || {})
    )
  })

  return {
    filteredEscrows: filteredAndSortedEscrows,
    userFillableEscrows,
    otherEscrows,
    debouncedSearchQuery
  }
}
