<template>
  <BaseDropdown :show="show" @close="$emit('close')">
    <div class="py-2">
        <!-- Loading State -->
        <div v-if="loading || loadingNFTs" class="p-4 text-center text-text-muted">
          <Icon icon="svg-spinners:ring-resize" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">{{ loadingNFTs ? 'Checking NFTs...' : 'Loading balances...' }}</p>
        </div>

        <!-- Loading Metadata State -->
        <div v-else-if="loadingMetadata && displayBalances.length > 0" class="p-2 text-center text-text-muted">
          <p class="text-xs">Loading token metadata...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:alert-circle-outline" class="w-8 h-8 inline-block mb-2 text-status-error" />
          <p class="text-sm text-status-error">{{ error }}</p>
        </div>

        <!-- No Wallet Connected -->
        <div v-else-if="!connected" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:wallet-outline" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">Connect wallet to see tokens</p>
        </div>

        <!-- Empty Balance -->
        <div v-else-if="displayBalances.length === 0 && !loadingNFTs" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:wallet-outline" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">No tokens found</p>
          <p v-if="selectedCollection" class="text-xs mt-1">No matching tokens or NFTs in your wallet for this collection</p>
        </div>

        <!-- Token List -->
        <div v-else class="divide-y divide-border-color">
          <button
            v-for="token in displayBalances"
            :key="token.mint"
            @click="handleTokenClick(token)"
            class="w-full px-4 py-3 hover:bg-secondary-bg/50 transition-colors flex items-center justify-between text-left"
          >
            <TokenDisplay :token="token" />
            <div class="flex items-center gap-2">
              <div class="text-right flex-shrink-0">
                <div v-if="token.balance !== undefined && token.balance !== null" class="text-sm font-medium text-text-primary">
                  {{ formatBalance(token.balance, token.decimals) }}
                </div>
                <div v-else-if="token.isCollectionItem" class="text-xs text-text-muted">
                  NFT
                </div>
              </div>
            </div>
          </button>
        </div>
    </div>
  </BaseDropdown>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import { useTokenStore } from '../stores/token'
import { useCollectionStore } from '../stores/collection'
import { useCollectionMetadataStore } from '../stores/collectionMetadata'
import { useWallet } from 'solana-wallets-vue'
import { formatBalance as formatBalanceUtil } from '../utils/formatters'
import { getAllowedMints } from '../utils/collectionHelpers'
import { logDebug } from '../utils/logger'
import BaseDropdown from './BaseDropdown.vue'
import TokenDisplay from './TokenDisplay.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'close'])

const { connected, publicKey } = useWallet()
const tokenStore = useTokenStore()
const collectionStore = useCollectionStore()
const collectionMetadataStore = useCollectionMetadataStore()

// Get selected collection
const selectedCollection = computed(() => collectionStore.selectedCollection)

// Get allowed mints for the selected collection
const allowedMints = computed(() => {
  if (!selectedCollection.value) return { currencyMints: [], tokenMints: [], nftCollectionMints: [], allMints: [] }
  return getAllowedMints(selectedCollection.value)
})

// Get cached collection NFTs for the selected marketplace
const cachedCollectionNFTs = computed(() => {
  if (!selectedCollection.value) return []
  return collectionMetadataStore.getCachedNFTs(selectedCollection.value.id)
})

// Filter balances based on selected collection
// Check ALL wallet SPL tokens (including NFTs) against allowed mints
const allBalances = computed(() => tokenStore.balances)
const balances = computed(() => {
  const all = allBalances.value || []
  
  // If no collection is selected, show all balances
  if (!selectedCollection.value) {
    return all
  }
  
  const { currencyMints, tokenMints, nftCollectionMints, allMints } = allowedMints.value
  
  // Filter tokens that match allowed mints
  // For currencies and tokens, check direct mint match
  // For NFTs (decimals === 0), we'll check collection membership asynchronously
  return all.filter(token => {
    // If it's a currency or token (decimals > 0), check direct mint match
    if (token.decimals > 0) {
      return allMints.includes(token.mint)
    }
    
    // If it's an NFT (decimals === 0), check if mint matches directly OR if collection matches
    // Direct mint match (for individual NFT mints in collectionMints)
    if (allMints.includes(token.mint)) {
      return true
    }
    
    // Collection membership will be checked asynchronously - include for now if we have NFT collections
    if (nftCollectionMints.length > 0) {
      // We'll check collection membership in displayBalances
      return true // Include all NFTs for now, filter by collection in displayBalances
    }
    
    return false
  })
})

// Process NFTs to check collection membership and filter
const processedBalances = ref([])
const loadingNFTs = ref(false)

// Process balances when they change or collection changes
const processBalances = async () => {
  const balanceList = balances.value || []
  const collection = selectedCollection.value
  
  if (!collection || balanceList.length === 0) {
    processedBalances.value = balanceList
    return
  }
  
  const { currencyMints, tokenMints, nftCollectionMints, allMints } = allowedMints.value
  
  logDebug(`Total wallet balances: ${balanceList.length}`)
  
  // If no NFT collections, filter to currencies/tokens only
  if (nftCollectionMints.length === 0) {
    const currenciesAndTokens = balanceList.filter(t => t.decimals > 0)
    processedBalances.value = currenciesAndTokens
    return
  }
  
  // Use wallet balances (DAS) as primary source for wallet NFTs – no Helius REST call.
  // DAS getAssetsByOwner already returns all tokens/NFTs from every program; filtering
  // decimals === 0 gives wallet NFTs. This avoids 500s from Helius REST /addresses/.../nfts.
  loadingNFTs.value = true
  const matchingNFTs = []
  
  const walletNFTs = balanceList
    .filter(b => b.decimals === 0)
    .map(b => ({
      mint: b.mint,
      name: b.name || null,
      symbol: b.symbol || null,
      image: b.image || null,
      decimals: 0,
      balance: b.balance ?? 1,
      collection: b.collection ?? null
    }))
  
  // Build sets for fast lookup
  const cachedNFTMints = new Set(cachedCollectionNFTs.value.map(cnft => cnft.mint))
  const collectionMintsSet = new Set(nftCollectionMints)
  
  // Separate currencies/tokens from the balance list
  const currenciesAndTokens = balanceList.filter(t => t.decimals > 0)
  
  // Match wallet NFTs only by preloaded collection mints (no on-chain metadata checks).
  // We already have the exact NFT mints for the collection; if wallet mint is in that set, it's a match.
  const directMatches = []
  const cachedMatches = []

  for (const nft of walletNFTs) {
    if (allMints.includes(nft.mint)) {
      directMatches.push(nft)
      continue
    }
    if (cachedNFTMints.has(nft.mint)) {
      cachedMatches.push(nft)
      continue
    }
    if (nft.collection && collectionMintsSet.has(nft.collection)) {
      cachedMatches.push(nft)
      continue
    }
    // Not in collection – skip (no on-chain check)
  }

  logDebug(`Wallet NFTs: ${directMatches.length} direct + ${cachedMatches.length} from cache = ${directMatches.length + cachedMatches.length} matching; ${currenciesAndTokens.length} tokens/currencies`)

  directMatches.forEach(nft => {
    matchingNFTs.push({
      ...nft,
      fetchingType: 'NFT',
      isCollectionItem: true
    })
  })

  cachedMatches.forEach(nft => {
    const cachedNFT = cachedCollectionNFTs.value.find(cnft => cnft.mint === nft.mint)
    matchingNFTs.push({
      ...nft,
      name: cachedNFT?.name || nft.name || `NFT ${nft.mint.slice(0, 8)}...`,
      symbol: cachedNFT?.symbol || nft.symbol || '',
      image: cachedNFT?.image || nft.image || null,
      collection: cachedNFT?.collectionMint || cachedNFT?.collection || nft.collection,
      fetchingType: 'NFT',
      isCollectionItem: true
    })
  })
  
  loadingNFTs.value = false
  processedBalances.value = [...currenciesAndTokens, ...matchingNFTs]
}

// Debounce processBalances to prevent rapid-fire calls
let processBalancesTimeout = null
const debouncedProcessBalances = () => {
  if (processBalancesTimeout) {
    clearTimeout(processBalancesTimeout)
  }
  processBalancesTimeout = setTimeout(() => {
    processBalances()
  }, 100) // 100ms debounce
}

// Watch for changes and process (debounced)
watch([balances, selectedCollection], debouncedProcessBalances, { immediate: true })

// Also process when dropdown opens (only if not already processing)
watch(() => props.show, (isShowing) => {
  if (isShowing && connected.value) {
    // Only trigger if balances or collection changed, otherwise use cached result
    debouncedProcessBalances()
  }
})

// Display balances (currencies + tokens + matching NFTs)
const displayBalances = computed(() => {
  const items = processedBalances.value || []
  
  // Sort: tokens first, then NFTs
  return items.sort((a, b) => {
    // Tokens first, then NFTs
    if (a.fetchingType !== 'NFT' && b.fetchingType === 'NFT') return -1
    if (a.fetchingType === 'NFT' && b.fetchingType !== 'NFT') return 1
    
    // For NFTs, group by collection
    if (a.fetchingType === 'NFT' && b.fetchingType === 'NFT') {
      const collectionA = a.collection || ''
      const collectionB = b.collection || ''
      if (collectionA !== collectionB) {
        return collectionA.localeCompare(collectionB)
      }
      return (a.name || '').localeCompare(b.name || '')
    }
    
    // For tokens, sort by balance descending
    return (b.balance || 0) - (a.balance || 0)
  })
})

const loading = computed(() => tokenStore.loadingBalances)
const error = computed(() => tokenStore.balancesError)
const loadingMetadata = computed(() => tokenStore.loadingMetadata)

// Offer side: each row is an individual NFT from the wallet; clicking selects that NFT (no instance selector)
const handleTokenClick = (token) => {
  selectToken(token)
}

const selectToken = (token) => {
  // Ensure balance is included when selecting token
  // Get balance from tokenStore if not present on token object
  const tokenWithBalance = { ...token }
  if ((tokenWithBalance.balance === undefined || tokenWithBalance.balance === null) && tokenWithBalance.mint) {
    const tokenFromStore = allBalances.value.find(t => t.mint === tokenWithBalance.mint)
    if (tokenFromStore && tokenFromStore.balance !== undefined && tokenFromStore.balance !== null) {
      tokenWithBalance.balance = tokenFromStore.balance
      tokenWithBalance.decimals = tokenWithBalance.decimals || tokenFromStore.decimals
    }
  }
  emit('select', tokenWithBalance)
  emit('close')
}

// Use formatBalance from utils with token decimals
const formatBalance = (balance, decimals) => {
  return formatBalanceUtil(balance, decimals || 9, false)
}
</script>
