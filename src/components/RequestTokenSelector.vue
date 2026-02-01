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

        <!-- Available options (shop currencies + collection items; no wallet balance needed for request) -->
        <div v-else-if="!searchQuery && displayTokens.length > 0" class="divide-y divide-border-color">
          <button
            v-for="token in displayTokens"
            :key="token.mint"
            @click="handleTokenClick(token)"
            class="w-full px-4 py-3 hover:bg-secondary-bg/50 transition-colors flex items-center justify-between text-left"
          >
            <TokenDisplay :token="token" :show-address="true" />
            <div class="flex items-center gap-2 flex-shrink-0">
              <Icon 
                v-if="token.fetchingType === 'NFT' && token.isCollectionItem" 
                icon="mdi:chevron-right" 
                class="w-4 h-4 text-text-muted"
              />
            </div>
          </button>
        </div>

        <!-- Empty: no marketplace selected or no options -->
        <div v-else-if="!searchQuery && displayTokens.length === 0 && !walletBalancesLoading" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:store-outline" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">{{ selectedCollection ? 'No options for this marketplace' : 'Select a marketplace to see options' }}</p>
          <p class="text-xs mt-1">Search by name, symbol, or token ID</p>
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
            <div class="flex items-center gap-2 flex-shrink-0">
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
import { useCollectionMetadataStore } from '../stores/collectionMetadata'
import { storeToRefs } from 'pinia'
import { useWallet } from 'solana-wallets-vue'
import { useDebounce, DEBOUNCE_DELAYS } from '@/composables/useDebounce'
import { getAllowedMints } from '@/utils/collectionHelpers'
import { getCollectionCurrencies } from '../utils/constants/baseCurrencies'
import BaseDropdown from './BaseDropdown.vue'
import TokenDisplay from './TokenDisplay.vue'
import NFTInstanceSelector from './NFTInstanceSelector.vue'
import { logError, logDebug } from '../utils/logger'
import { formatBalance as formatBalanceUtil } from '../utils/formatters'

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
const collectionMetadataStore = useCollectionMetadataStore()

// Get selected collection
const selectedCollection = computed(() => collectionStore.selectedCollection)

// Check if we should filter tokens based on collection
const shouldFilterByCollection = computed(() => {
  if (!selectedCollection.value) return false
  
  const { allMints } = allowedMints.value
  return allMints.length > 0
})

// Get allowed mints from collection
const allowedMints = computed(() => {
  if (!selectedCollection.value) return { currencyMints: [], tokenMints: [], nftCollectionMints: [], allMints: [] }
  return getAllowedMints(selectedCollection.value)
})

// Convert collectionMints items to token-like objects for display
// These represent collection categories/types, not individual NFTs
// Enrich with images from token store cache
const collectionMintsAsTokens = computed(() => {
  if (!selectedCollection.value) return []
  
  const collectionMints = selectedCollection.value.collectionMints || []
  
  // Convert collection items to token-like objects for display
  return collectionMints
    .filter(item => typeof item === 'object' && item.mint)
    .map(item => {
      // Try to get image from token store cache
      const cachedTokenInfo = tokenStore.getCachedTokenInfo(item.mint)
      const cachedMetadata = collectionMetadataStore.getCachedTokenMetadata(item.mint)
      
      // Prefer cached image, then collection item image, then null
      const image = cachedTokenInfo?.image || cachedMetadata?.image || item.image || null
      
      return {
        mint: item.mint,
        name: cachedTokenInfo?.name || cachedMetadata?.name || item.name || '',
        symbol: cachedTokenInfo?.symbol || cachedMetadata?.symbol || item.name || item.mint.slice(0, 8),
        decimals: item.fetchingType === 'NFT' ? 0 : (item.decimals || 9),
        image: image,
        isCollectionItem: true,
        itemType: item.itemType,
        fetchingType: item.fetchingType,
        class: item.class,
        category: item.category
      }
    })
})

// Get allowed currencies as token-like objects for display
// Enrich with images from token store cache
const allowedCurrenciesAsTokens = computed(() => {
  if (!selectedCollection.value) return []
  
  const collectionCurrencies = getCollectionCurrencies(selectedCollection.value)
  
  return collectionCurrencies.map(currency => {
    // Try to get image from token store cache
    const cachedTokenInfo = tokenStore.getCachedTokenInfo(currency.mint)
    
    return {
      mint: currency.mint,
      name: cachedTokenInfo?.name || currency.name || '',
      symbol: cachedTokenInfo?.symbol || currency.symbol || '',
      decimals: cachedTokenInfo?.decimals || 9,
      image: cachedTokenInfo?.image || null, // Use cached image if available
      isCollectionItem: false,
      fetchingType: 'Token',
      isCurrency: true
    }
  })
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

const debouncedSearch = useDebounce((query) => {
  if (query && query.trim()) {
    performSearch(query)
  } else {
    localSearchResults.value = []
  }
}, DEBOUNCE_DELAYS.MEDIUM)

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
        if (shouldFilterByCollection.value && allowedMints.value && allowedMints.value.allMints) {
          if (!allowedMints.value.allMints.includes(tokenInfo.mint)) {
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
  if (!shouldFilterByCollection.value || !allowedMints.value || !allowedMints.value.allMints) {
    return tokens
  }
  
  return tokens.filter(token => allowedMints.value.allMints.includes(token.mint))
}

// Merge wallet balance into a token (currency or token/SFT). For NFT collection items, use NFT count.
function mergeBalanceIntoToken(item, walletBalancesList, collectionId) {
  const isNFTCollectionItem = item.fetchingType === 'NFT' && item.isCollectionItem
  if (isNFTCollectionItem) {
    const cachedNFTs = collectionMetadataStore.getCachedNFTs(collectionId) || []
    const nftMintsInThisCollection = cachedNFTs
      .filter(nft => (nft.collectionMint || nft.collection) === item.mint)
      .map(nft => nft.mint)
    const count = walletBalancesList.filter(b => nftMintsInThisCollection.includes(b.mint))
      .reduce((sum, b) => sum + (Number(b.balance) || 0), 0)
    return { ...item, balance: count, balanceRaw: String(Math.floor(count)), decimals: 0 }
  }
  const walletBalance = walletBalancesList.find(b => b.mint === item.mint)
  if (walletBalance) {
    return {
      ...item,
      balance: walletBalance.balance,
      balanceRaw: walletBalance.balanceRaw,
      decimals: item.decimals ?? walletBalance.decimals
    }
  }
  return { ...item, balance: 0, balanceRaw: '0' }
}

// Computed display tokens: show shop options only (collection items + currencies). Request does not need wallet balances.
const displayTokens = computed(() => {
  let tokens = []
  
  if (searchQuery.value && searchQuery.value.trim()) {
    // When searching, show search results filtered by collection (no balance needed for request)
    const filtered = filterTokensByCollection(localSearchResults.value)
    const collectionId = selectedCollection.value?.id
    tokens = filtered.map(t => mergeBalanceIntoToken(t, [], collectionId))
  } else {
    // Default view: shop options only (collection items + currencies), no wallet balance
    if (selectedCollection.value) {
      const collectionItems = collectionMintsAsTokens.value || []
      const currencies = allowedCurrenciesAsTokens.value || []
      const collectionId = selectedCollection.value.id
      const existingMints = new Set()
      tokens = []
      const addItem = (item) => {
        if (existingMints.has(item.mint)) return
        existingMints.add(item.mint)
        tokens.push(mergeBalanceIntoToken(item, [], collectionId))
      }
      collectionItems.forEach(addItem)
      currencies.forEach(addItem)
    }
    // No fallback to wallet: request selector shows only shop options
  }
  
  return tokens
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
  // If it's an NFT collection type (request "which NFT from this collection"), open instance selector to pick one from the collection
  if (token.fetchingType === 'NFT' && token.isCollectionItem && selectedCollection.value) {
    selectedCollectionItem.value = {
      ...token,
      parentCollectionMint: token.mint
    }
    showNFTSelector.value = true
    return
  }
  
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

// Preload registry on mount and preload collection images
watch(() => props.show, (isShowing) => {
  if (isShowing) {
    preloadRegistry()
    
    // Preload images for collection items and currencies
    if (selectedCollection.value) {
      const itemsToPreload = [...collectionMintsAsTokens.value, ...allowedCurrenciesAsTokens.value]
      
      // Preload images in background
      for (const item of itemsToPreload) {
        if (item.mint && !item.image) {
          // Check cache first
          const cached = tokenStore.getCachedTokenInfo(item.mint)
          if (!cached || !cached.image) {
            // Fetch in background
            tokenStore.fetchTokenInfo(item.mint).catch(() => {
              // Silently fail - images are optional
            })
          }
        }
      }
      
      // Ensure collection NFTs are preloaded
      const cachedNFTs = collectionMetadataStore.getCachedNFTs(selectedCollection.value.id)
      if (cachedNFTs.length === 0 && !collectionMetadataStore.isLoading(selectedCollection.value.id)) {
        // Trigger preload if not already loading
        collectionMetadataStore.preloadCollectionNFTs(selectedCollection.value).catch(() => {
          // Silently fail
        })
      }
    }
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

const formatBalance = (balance, decimals) => formatBalanceUtil(balance, decimals ?? 9, false)
</script>
