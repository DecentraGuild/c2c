<template>
  <BaseDropdown 
    :show="show" 
    container-class="bg-card-bg border border-border-color rounded-xl shadow-xl max-h-96 overflow-hidden flex flex-col"
    @close="$emit('close')"
  >
      <!-- Unified Search Input -->
      <div class="p-3 border-b border-border-color">
        <div class="relative">
          <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, symbol, or token ID..."
            class="input-field w-full pl-9 pr-3"
            @input="handleSearch"
            @keyup.enter="handleEnterKey"
            @focus="handleSearch"
          />
        </div>
        <div v-if="searchError" class="mt-1.5 text-xs text-status-error">
          {{ searchError }}
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto">
        <!-- Loading State -->
        <div v-if="isLoading || fetchingTokenInfo || localFetchingTokenInfo" class="p-4 text-center text-text-muted">
          <Icon icon="svg-spinners:ring-resize" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">{{ (fetchingTokenInfo || localFetchingTokenInfo) ? 'Fetching token info...' : 'Searching tokens...' }}</p>
        </div>

        <!-- Error State (only when not searching) -->
        <div v-else-if="error && !searchQuery && walletBalancesLoading" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:alert-circle-outline" class="w-8 h-8 inline-block mb-2 text-status-error" />
          <p class="text-sm text-status-error">{{ error }}</p>
        </div>

        <!-- Wallet Balances (default view when no search) -->
        <div v-else-if="!searchQuery && displayTokens.length > 0" class="divide-y divide-border-color">
          <button
            v-for="token in displayTokens"
            :key="token.mint"
            @click="handleTokenClick(token)"
            class="w-full px-4 py-3 hover:bg-secondary-bg/50 transition-colors flex items-center justify-between text-left"
          >
            <TokenDisplay :token="token" :show-address="true" />
            <div class="flex items-center gap-2">
              <div v-if="token.decimals !== null && token.decimals !== undefined" class="text-right flex-shrink-0">
                <div class="text-xs text-text-muted">
                  {{ token.decimals }} decimals
                </div>
              </div>
              <Icon 
                v-if="token.fetchingType === 'NFT' && token.isCollectionItem" 
                icon="mdi:chevron-right" 
                class="w-4 h-4 text-text-muted"
              />
            </div>
          </button>
        </div>

        <!-- Empty Wallet State -->
        <div v-else-if="!searchQuery && displayTokens.length === 0 && !walletBalancesLoading" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:wallet-outline" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">No tokens in wallet</p>
          <p class="text-xs mt-1">Search for tokens by name, symbol, or token ID</p>
        </div>

        <!-- No Results (when searching) -->
        <div v-else-if="searchQuery && displayTokens.length === 0 && !isLoading && !fetchingTokenInfo && !localFetchingTokenInfo" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:information-outline" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">No tokens found</p>
          <p class="text-xs mt-1">Try searching by name, symbol, or enter a token ID</p>
        </div>

        <!-- Search Results -->
        <div v-else-if="searchQuery && displayTokens.length > 0" class="divide-y divide-border-color">
          <button
            v-for="token in displayTokens"
            :key="token.mint"
            @click="handleTokenClick(token)"
            class="w-full px-4 py-3 hover:bg-secondary-bg/50 transition-colors flex items-center justify-between text-left"
          >
            <TokenDisplay :token="token" :show-address="true" />
            <div class="flex items-center gap-2">
              <div v-if="token.decimals !== null && token.decimals !== undefined" class="text-right flex-shrink-0">
                <div class="text-xs text-text-muted">
                  {{ token.decimals }} decimals
                </div>
              </div>
              <Icon 
                v-if="token.fetchingType === 'NFT' && token.isCollectionItem" 
                icon="mdi:chevron-right" 
                class="w-4 h-4 text-text-muted"
              />
            </div>
          </button>
        </div>
      </div>
  </BaseDropdown>

  <!-- NFT Instance Selector (fullscreen, outside dropdown) -->
  <NFTInstanceSelector
    v-if="showNFTSelector"
    :show="showNFTSelector"
    :collection-item="selectedCollectionItem"
    source="collection"
    @select="handleNFTSelect"
    @close="showNFTSelector = false"
  />
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useTokenStore } from '../stores/token'
import { useCollectionStore } from '../stores/collection'
import { storeToRefs } from 'pinia'
import { useWallet } from 'solana-wallets-vue'
import { debounce } from '../utils/debounce'
import BaseDropdown from './BaseDropdown.vue'
import TokenDisplay from './TokenDisplay.vue'
import NFTInstanceSelector from './NFTInstanceSelector.vue'
import { logError } from '../utils/logger'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'close'])

const { connected } = useWallet()
const tokenStore = useTokenStore()
const collectionStore = useCollectionStore()

// Get selected collection
const selectedCollection = computed(() => collectionStore.selectedCollection)

// Check if we should filter tokens based on collection
const shouldFilterByCollection = computed(() => {
  if (!selectedCollection.value) return false
  
  const collectionMints = selectedCollection.value.collectionMints || []
  const allowedCurrencies = selectedCollection.value.allowedCurrencies || []
  
  // Only filter if we have currencies configured
  return allowedCurrencies.length > 0 || collectionMints.length > 0
})

// Get allowed mints from collection
const allowedMints = computed(() => {
  if (!selectedCollection.value) return null
  
  const collectionMints = selectedCollection.value.collectionMints || []
  const allowedCurrencies = selectedCollection.value.allowedCurrencies || []
  
  // Separate Token and NFT collection mints
  const tokenCollectionMints = collectionMints.filter(
    item => typeof item === 'string' || (typeof item === 'object' && item.fetchingType !== 'NFT')
  )
  const nftCollectionMints = collectionMints.filter(
    item => typeof item === 'object' && item.fetchingType === 'NFT'
  )
  
  // Extract mint addresses from token collection mints
  const tokenCollectionMintAddresses = tokenCollectionMints.map(item => 
    typeof item === 'string' ? item : item.mint
  )
  
  // For NFT collection mints, we'll include the fetched NFTs separately
  // For now, include the collection mint addresses themselves
  const nftCollectionMintAddresses = nftCollectionMints.map(item => item.mint)
  
  // Combine token collection mints, NFT collection mint addresses, and allowed currencies
  return [...tokenCollectionMintAddresses, ...nftCollectionMintAddresses, ...allowedCurrencies]
})

// Convert collectionMints items to token-like objects for display
// These represent collection categories/types, not individual NFTs
const collectionMintsAsTokens = computed(() => {
  if (!selectedCollection.value) return []
  
  const collectionMints = selectedCollection.value.collectionMints || []
  
  // Convert collection items to token-like objects for display
  return collectionMints
    .filter(item => typeof item === 'object' && item.mint)
    .map(item => ({
      mint: item.mint,
      name: item.name || '',
      symbol: item.name || item.mint.slice(0, 8),
      decimals: item.fetchingType === 'NFT' ? 0 : (item.decimals || 9),
      image: item.image || null,
      isCollectionItem: true,
      itemType: item.itemType,
      fetchingType: item.fetchingType,
      class: item.class,
      category: item.category
    }))
})

// Use storeToRefs for refs that need to be reactive (like searchQuery for v-model)
const { searchQuery } = storeToRefs(tokenStore)

// Access other store properties via computed to maintain reactivity
const walletBalances = computed(() => tokenStore.balances)
const walletBalancesLoading = computed(() => tokenStore.loadingBalances)
const registryLoading = computed(() => tokenStore.loadingRegistry)
const balancesError = computed(() => tokenStore.balancesError)
const registryError = computed(() => tokenStore.registryError)
const registrySearchResults = computed(() => tokenStore.searchResults)
const fetchingTokenInfo = computed(() => tokenStore.fetchingTokenInfo)

// Methods can be accessed directly from store
const { 
  searchTokens,
  preloadRegistry,
  fetchTokenInfo
} = tokenStore

const searchError = ref(null)
const searchLoading = ref(false)
const localSearchResults = ref([])
const localFetchingTokenInfo = ref(false)
const showNFTSelector = ref(false)
const selectedCollectionItem = ref(null)

// Check if query looks like a token ID (Solana address format)
const isTokenIdFormat = (query) => {
  if (!query || query.trim().length < 8) return false
  // Solana addresses are base58 encoded, typically 32-44 characters
  // Check if it looks like a base58 string (no 0, O, I, l)
  const base58Pattern = /^[1-9A-HJ-NP-Za-km-z]+$/
  return base58Pattern.test(query.trim()) && query.trim().length >= 32
}

// Calculate match score for a token (higher = better match)
const getMatchScore = (token, query) => {
  const trimmedQuery = query.trim().toLowerCase()
  const tokenSymbol = token.symbol?.toLowerCase() || ''
  const tokenName = token.name?.toLowerCase() || ''
  const tokenMint = token.mint.toLowerCase()
  
  // Exact symbol match (highest priority)
  if (tokenSymbol === trimmedQuery) return 1000
  
  // Exact name match
  if (tokenName === trimmedQuery) return 900
  
  // Symbol starts with query
  if (tokenSymbol.startsWith(trimmedQuery)) return 800
  
  // Name starts with query
  if (tokenName.startsWith(trimmedQuery)) return 700
  
  // Symbol contains query
  if (tokenSymbol.includes(trimmedQuery)) return 600
  
  // Name contains query
  if (tokenName.includes(trimmedQuery)) return 500
  
  // Token ID match (only if query looks like a token ID or no name/symbol matches found)
  if (tokenMint.includes(trimmedQuery)) return 100
  
  return 0
}

// Check if token matches the query
const tokenMatches = (token, query) => {
  const trimmedQuery = query.trim().toLowerCase()
  const tokenSymbol = token.symbol?.toLowerCase() || ''
  const tokenName = token.name?.toLowerCase() || ''
  const tokenMint = token.mint.toLowerCase()
  
  // If query looks like a token ID, allow mint matches
  if (isTokenIdFormat(query)) {
    return tokenMint.includes(trimmedQuery)
  }
  
  // Otherwise, prioritize name/symbol matches
  return tokenSymbol.includes(trimmedQuery) || 
         tokenName.includes(trimmedQuery) ||
         tokenMint.includes(trimmedQuery)
}

// Enhanced search that checks wallet, registry, collectionMints, and fetches token info
const performSearch = async (query) => {
  if (!query || !query.trim()) {
    return
  }

  searchLoading.value = true
  searchError.value = null

  try {
    const trimmedQuery = query.trim().toLowerCase()
    const results = []

    // If query looks like a token ID, try to fetch it directly first
    if (isTokenIdFormat(query)) {
      try {
        const tokenInfo = await fetchTokenInfo(query.trim())
        if (tokenInfo) {
          // Check if token is allowed by collection filter
          if (!shouldFilterByCollection.value || (allowedMints.value && allowedMints.value.includes(tokenInfo.mint))) {
            results.push(tokenInfo)
          }
        }
      } catch (err) {
        logDebug('Failed to fetch token by ID:', err)
      }
    }

    // Search in collectionMints by name (if collection is selected)
    if (selectedCollection.value && collectionMintsAsTokens.value.length > 0) {
      collectionMintsAsTokens.value.forEach(collectionToken => {
        const tokenName = (collectionToken.name || '').toLowerCase()
        const tokenMint = collectionToken.mint.toLowerCase()
        
        // Check if name or mint matches the query
        if (tokenName.includes(trimmedQuery) || tokenMint.includes(trimmedQuery)) {
          // Only add if not already in results
          if (!results.find(t => t.mint === collectionToken.mint)) {
            // Score collection items: exact name match > name starts with > name contains > mint match
            let score = 100
            if (tokenName === trimmedQuery) {
              score = 1000 // Exact name match (highest priority)
            } else if (tokenName.startsWith(trimmedQuery)) {
              score = 950 // Name starts with query
            } else if (tokenName.includes(trimmedQuery)) {
              score = 900 // Name contains query
            }
            results.push({ ...collectionToken, _matchScore: score })
          }
        }
      })
    }

    // Search in wallet balances
    if (connected.value && walletBalances.value) {
      walletBalances.value.forEach(token => {
        if (tokenMatches(token, query)) {
          // Filter by collection if needed
          if (!shouldFilterByCollection.value || (allowedMints.value && allowedMints.value.includes(token.mint))) {
            if (!results.find(t => t.mint === token.mint)) {
              results.push(token)
            }
          }
        }
      })
    }

    // Search in registry with our own prioritization logic
    // (only if not already found or query doesn't look like token ID)
    if (!isTokenIdFormat(query) || results.length === 0) {
      // Preload registry to ensure it's available
      await preloadRegistry()
      
      // Use the registry search, but we'll re-prioritize the results
      await searchTokens(query)
      
      // Get registry results and score them properly
      const registryResults = registrySearchResults.value || []
      
      // Score all registry results
      const scoredResults = registryResults
        .map(token => ({
          token,
          score: getMatchScore(token, query)
        }))
        .filter(({ score }) => {
          // Only include tokens that match by name/symbol (unless query is token ID)
          if (isTokenIdFormat(query)) {
            return score > 0 // Allow all matches for token ID queries
          }
          return score >= 500 // Only name/symbol matches for text queries
        })
        .sort((a, b) => b.score - a.score) // Sort by score descending
      
      // Add registry results, avoiding duplicates
      // Prioritize exact matches by adding them first
      scoredResults.forEach(({ token, score }) => {
        // Filter by collection if needed
        if (!shouldFilterByCollection.value || (allowedMints.value && allowedMints.value.includes(token.mint))) {
          if (!results.find(t => t.mint === token.mint)) {
            // Insert exact matches at the beginning
            if (score >= 900) {
              // Exact name or symbol match - insert at beginning
              results.unshift(token)
            } else {
              results.push(token)
            }
          }
        }
      })
    }

    // Sort results by match score (highest first)
    results.sort((a, b) => {
      // Use _matchScore if available (for collection items), otherwise calculate
      const scoreA = a._matchScore !== undefined ? a._matchScore : getMatchScore(a, query)
      const scoreB = b._matchScore !== undefined ? b._matchScore : getMatchScore(b, query)
      
      // Higher score comes first
      if (scoreA > scoreB) return -1
      if (scoreA < scoreB) return 1
      
      // If scores are equal, prefer exact symbol matches
      const aSymbol = a.symbol?.toLowerCase() || ''
      const bSymbol = b.symbol?.toLowerCase() || ''
      if (aSymbol === trimmedQuery && bSymbol !== trimmedQuery) return -1
      if (aSymbol !== trimmedQuery && bSymbol === trimmedQuery) return 1
      
      return 0
    })

    // Filter: If we have name/symbol matches, exclude token ID-only matches
    // (unless query looks like a token ID)
    const hasNameSymbolMatches = results.some(token => {
      const score = token._matchScore !== undefined ? token._matchScore : getMatchScore(token, query)
      return score >= 500 // Symbol/name contains or better
    })
    
    let filteredResults = results
    if (hasNameSymbolMatches && !isTokenIdFormat(query)) {
      // Only keep tokens that match by name/symbol (score >= 500)
      // Exclude token ID-only matches when we have better matches
      filteredResults = results.filter(token => {
        const score = token._matchScore !== undefined ? token._matchScore : getMatchScore(token, query)
        // Keep exact matches, starts with, and contains for name/symbol
        // Exclude token ID-only matches (score = 100)
        return score >= 500
      })
    }
    
    // Clean up _matchScore from results before returning
    filteredResults = filteredResults.map(token => {
      const { _matchScore, ...cleanToken } = token
      return cleanToken
    })
    
    // Final sort to ensure exact matches are at the top
    filteredResults.sort((a, b) => {
      const scoreA = getMatchScore(a, query)
      const scoreB = getMatchScore(b, query)
      
      // Higher score comes first
      if (scoreA > scoreB) return -1
      if (scoreA < scoreB) return 1
      
      // If scores are equal, prefer exact symbol matches
      const trimmedQuery = query.trim().toLowerCase()
      const aSymbol = a.symbol?.toLowerCase() || ''
      const bSymbol = b.symbol?.toLowerCase() || ''
      if (aSymbol === trimmedQuery && bSymbol !== trimmedQuery) return -1
      if (aSymbol !== trimmedQuery && bSymbol === trimmedQuery) return 1
      
      return 0
    })

    // Filter by collection if needed
    let finalResults = filteredResults
    if (shouldFilterByCollection.value && allowedMints.value) {
      finalResults = filteredResults.filter(token => allowedMints.value.includes(token.mint))
    }
    
    // Update search results
    localSearchResults.value = finalResults.slice(0, 50)
  } catch (err) {
    logError('Error performing search:', err)
    searchError.value = err.message || 'Failed to search tokens'
    localSearchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

// Debounced search function
const debouncedSearch = debounce((query) => {
  if (query && query.trim()) {
    performSearch(query)
  } else {
    localSearchResults.value = []
  }
}, 300)

const handleSearch = () => {
  const query = searchQuery.value
  if (!query || !query.trim()) {
    localSearchResults.value = []
    searchError.value = null
    return
  }
  debouncedSearch(query)
}

const handleEnterKey = async () => {
  const query = searchQuery.value?.trim()
  if (!query) return

  // If it looks like a token ID, try to fetch it directly
  if (isTokenIdFormat(query)) {
    try {
      localFetchingTokenInfo.value = true
      searchError.value = null
      const tokenInfo = await fetchTokenInfo(query)
      if (tokenInfo) {
        // Check if token is allowed by collection filter
        if (shouldFilterByCollection.value && allowedMints.value) {
          if (!allowedMints.value.includes(tokenInfo.mint)) {
            searchError.value = 'This token is not available for the selected collection'
            return
          }
        }
        selectToken(tokenInfo)
        return
      }
    } catch (err) {
      searchError.value = 'Invalid token address or token not found'
    } finally {
      localFetchingTokenInfo.value = false
    }
  }
}

// Filter tokens based on collection if needed
const filterTokensByCollection = (tokens) => {
  if (!shouldFilterByCollection.value || !allowedMints.value) {
    return tokens
  }
  
  return tokens.filter(token => allowedMints.value.includes(token.mint))
}

// Computed display tokens: wallet balances when no search, search results when searching
const displayTokens = computed(() => {
  let tokens = []
  
  if (searchQuery.value && searchQuery.value.trim()) {
    tokens = localSearchResults.value
  } else {
    // Show collection items first (when collection is selected)
    // These represent collection categories/types that can be clicked to see individual NFTs
    if (selectedCollection.value && collectionMintsAsTokens.value.length > 0) {
      tokens = collectionMintsAsTokens.value
    } else {
      // Fallback to wallet balances if no collection selected
      tokens = walletBalances.value || []
    }
  }
  
  // Filter by collection if needed
  return filterTokensByCollection(tokens)
})

// Computed loading state
const isLoading = computed(() => {
  return registryLoading.value || searchLoading.value
})

// Computed error state
const error = computed(() => {
  return registryError.value || searchError.value
})

const handleTokenClick = async (token) => {
  // If it's an NFT collection item, show NFT instance selector to pick individual NFT
  if (token.fetchingType === 'NFT' && token.isCollectionItem && selectedCollection.value) {
    // Create a collection item object that preserves parent collection info
    selectedCollectionItem.value = {
      ...token,
      // Preserve parent collection's collectionMint for fetching all NFTs
      parentCollectionMint: selectedCollection.value.collectionMint
    }
    showNFTSelector.value = true
    return
  }
  
  // Otherwise, select the token directly
  await selectToken(token)
}

const handleNFTSelect = async (nft) => {
  // Fetch complete token info if needed
  let tokenToSelect = nft
  
  if (nft.decimals === null || nft.decimals === undefined) {
    const completeInfo = await fetchTokenInfo(nft.mint)
    if (completeInfo) {
      tokenToSelect = completeInfo
    }
  }
  
  emit('select', tokenToSelect)
  emit('close')
}

const selectToken = async (token) => {
  // If token doesn't have decimals, fetch complete info
  let tokenToSelect = token
  
  if (token.decimals === null || token.decimals === undefined) {
    // Fetch complete token info including decimals
    const completeInfo = await fetchTokenInfo(token.mint)
    if (completeInfo) {
      tokenToSelect = completeInfo
    }
  }
  
  emit('select', tokenToSelect)
  emit('close')
}

// Preload registry on mount
watch(() => props.show, (isShowing) => {
  if (isShowing) {
    preloadRegistry()
  }
}, { immediate: true })

// Watch for show prop to reset state
watch(() => props.show, (isShowing) => {
  if (isShowing) {
    searchQuery.value = ''
    searchError.value = null
    localSearchResults.value = []
  }
})
</script>
