/**
 * Composable for marketplace filtering logic
 * Centralizes filtering operations for better performance and reusability
 */

import { computed } from 'vue'
import { useDebouncedSearch } from './useDebouncedSearch'
import {
  filterEscrowsByStorefront,
  filterEscrowsByTradeType,
  filterActiveEscrows,
  sortEscrowsByUserBalance,
  canUserFillEscrow,
  belongsToShop,
  getTradeType,
  getShopCurrencyMints
} from '@/utils/marketplaceHelpers'
import { getMetadataForMint } from '@/utils/marketplaceFilterMetadata'
import { getCollectionCurrencies } from '@/utils/constants/baseCurrencies'
import { getEscrowItemMetadata } from './useCollectionMetadata'
import { useStorefrontMetadataStore } from '@/stores/storefrontMetadata'

/**
 * Composable for marketplace filtering - optimized single-pass filtering
 * @param {Object} options - Configuration options
 * @param {import('vue').Ref<Array>} options.allEscrows - All escrows to filter
 * @param {import('vue').Ref<Object>} options.selectedStorefront - Currently selected storefront (tenant)
 * @param {import('vue').Ref<string>} options.selectedTradeType - Selected trade type filter ('all'|'nft-to-token'|'token-to-nft'|'nft-to-nft')
 * @param {import('vue').Ref<Object>} options.userBalances - User token balances map (mint -> balance)
 * @param {import('vue').Ref<Set>} options.activeFilters - Active itemType/class filters (Set of 'itemType:class' strings)
 * @param {import('vue').Ref<Set>} options.activeCollectionFilters - Active collection filters (Set of collection mint ids)
 * @param {import('vue').Ref<string>} options.searchQuery - Search query string
 * @returns {{filteredEscrows: import('vue').ComputedRef<Array>, userFillableEscrows: import('vue').ComputedRef<Array>, otherEscrows: import('vue').ComputedRef<Array>, debouncedSearchQuery: import('vue').Ref<string>}} Filtered escrows and helper functions
 */
function useMarketplaceFilters({
  allEscrows,
  selectedStorefront,
  selectedTradeType,
  userBalances,
  activeFilters,
  activeCollectionFilters,
  searchQuery
}) {
  const { debouncedQuery: debouncedSearchQuery } = useDebouncedSearch(searchQuery)
  const storefrontMetadataStore = useStorefrontMetadataStore()

  /**
   * Cached NFT mints for the selected storefront (individual NFTs from metadata)
   * So escrows that use any NFT from the storefront show up, not only those in collectionMints
   */
  const cachedCollectionMintSet = computed(() => {
    const storefront = selectedStorefront.value
    if (!storefront?.id) return new Set()
    const nfts = storefrontMetadataStore.getCachedNFTs(storefront.id)
    return new Set(
      (nfts || [])
        .map(n => (n?.mint && String(n.mint).toLowerCase()) || null)
        .filter(Boolean)
    )
  })

  /**
   * Combined filtering logic - single pass for better performance
   * Applies all filters (storefront, trade type, itemType/class, search) in one iteration
   */
  const filteredAndSortedEscrows = computed(() => {
    // Early return if no storefront or escrows
    if (!selectedStorefront.value || !allEscrows.value || allEscrows.value.length === 0) {
      return []
    }

    const query = debouncedSearchQuery.value?.trim()
    const lowerQuery = query ? query.toLowerCase() : null
    const hasActiveFilters = activeFilters.value && activeFilters.value.size > 0
    const hasCollectionFilters = activeCollectionFilters?.value?.size > 0

    const storefront = selectedStorefront.value
    const shopCurrencyMints = getShopCurrencyMints(storefront) || []
    const collectionMints = storefront.collectionMints || []
    const cachedMints = cachedCollectionMintSet.value
    const cachedNFTs = storefront?.id ? (storefrontMetadataStore.getCachedNFTs(storefront.id) || []) : []
    const shopCurrencies = getCollectionCurrencies(storefront) || []
    const metadataOpts = { cachedNFTs, shopCurrencies }

    // Single pass filter - combines all filter conditions
    const filtered = allEscrows.value.filter(escrow => {
      // Filter 1: Both sides must belong to the shop (storefront mints, cached NFT mints, or shop currencies)
      const depositMint = escrow.depositToken?.mint
      const requestMint = escrow.requestToken?.mint
      if (!depositMint || !requestMint) return false
      const shopOptions = { cachedCollectionMints: cachedMints }
      if (!belongsToShop(depositMint, storefront, shopOptions) || !belongsToShop(requestMint, storefront, shopOptions)) {
        return false
      }

      // Filter 2: Active status (not closed/expired) and has remaining deposit
      if (escrow.status === 'closed' || escrow.depositRemaining <= 0) {
        return false
      }

      // Filter 3: Trade type
      const tradeType = selectedTradeType.value
      if (tradeType !== 'all') {
        const escrowTradeType = getTradeType(escrow, collectionMints, shopCurrencyMints, cachedMints)
        if (escrowTradeType !== tradeType) {
          return false
        }
      }

      // Filter 4: ItemType/class filters (match if any selected filter matches deposit OR request)
      if (hasActiveFilters) {
        const depositMeta = getMetadataForMint(storefront, depositMint, metadataOpts)
        const requestMeta = getMetadataForMint(storefront, requestMint, metadataOpts)
        const depositKey = depositMeta ? `${depositMeta.itemType || 'unknown'}:${depositMeta.class || 'unknown'}` : null
        const requestKey = requestMeta ? `${requestMeta.itemType || 'unknown'}:${requestMeta.class || 'unknown'}` : null
        const matchesFilter =
          (depositKey && activeFilters.value.has(depositKey)) ||
          (requestKey && activeFilters.value.has(requestKey))
        if (!matchesFilter) return false
      }

      // Filter 5: Collection filter (escrow has selected collection on deposit OR request)
      if (hasCollectionFilters) {
        const depositMeta = getMetadataForMint(storefront, depositMint, metadataOpts)
        const requestMeta = getMetadataForMint(storefront, requestMint, metadataOpts)
        const matchesCollection =
          (depositMeta?.collectionId && activeCollectionFilters.value.has(depositMeta.collectionId)) ||
          (requestMeta?.collectionId && activeCollectionFilters.value.has(requestMeta.collectionId))
        if (!matchesCollection) return false
      }

      // Filter 6: Search query
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
        
        // Check storefront metadata (more expensive, only if text search fails)
        const depositMetadata = getEscrowItemMetadata(selectedStorefront.value, {
          depositToken: escrow.depositToken,
          requestToken: escrow.requestToken
        })
        const requestMetadata = getEscrowItemMetadata(selectedStorefront.value, escrow)
        
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

export { useMarketplaceFilters }
export default useMarketplaceFilters
