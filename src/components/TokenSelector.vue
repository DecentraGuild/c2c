<template>
  <BaseDropdown :show="show" @close="$emit('close')">
    <div class="py-2">
        <!-- Loading State -->
        <div v-if="loading || loadingWalletNFTs" class="p-4 text-center text-text-muted">
          <Icon icon="svg-spinners:ring-resize" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">{{ loadingWalletNFTs ? 'Loading NFTs from wallet...' : 'Loading balances...' }}</p>
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
        <div v-else-if="displayBalances.length === 0 && !loadingWalletNFTs" class="p-4 text-center text-text-muted">
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
              <Icon 
                v-if="token.fetchingType === 'NFT' && token.isCollectionItem && selectedCollection" 
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
    source="wallet"
    @select="handleNFTSelect"
    @close="showNFTSelector = false"
  />
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import { useTokenStore } from '../stores/token'
import { useCollectionStore } from '../stores/collection'
import { useWallet } from 'solana-wallets-vue'
import { formatBalance as formatBalanceUtil } from '../utils/formatters'
import { useWalletNFTs } from '../composables/useWalletNFTs'
import BaseDropdown from './BaseDropdown.vue'
import TokenDisplay from './TokenDisplay.vue'
import NFTInstanceSelector from './NFTInstanceSelector.vue'

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

// Fetch NFTs from wallet that belong to collection
const { nfts: walletNFTs, loading: loadingWalletNFTs, fetchWalletNFTs } = useWalletNFTs(selectedCollection)

// Watch for collection changes and fetch wallet NFTs if needed
// Only fetch when dropdown is shown and wallet is connected
watch([selectedCollection, () => props.show, connected], async ([collection, isShowing, isConnected]) => {
  if (isShowing && isConnected && collection) {
    // Check if any collectionMints have fetchingType === 'NFT'
    const collectionMints = collection.collectionMints || []
    const hasNFTCollections = collectionMints.some(
      item => typeof item === 'object' && item.fetchingType === 'NFT'
    )
    
    if (hasNFTCollections) {
      await fetchWalletNFTs()
    }
  } else {
    // Clear NFTs when not showing or not connected
    walletNFTs.value = []
  }
}, { immediate: false })

// Filter balances based on selected collection
// When a collection is selected, only show tokens/NFTs that match collectionMints
const allBalances = computed(() => tokenStore.balances)
const balances = computed(() => {
  const all = allBalances.value || []
  
  // If no collection is selected, show all balances
  if (!selectedCollection.value) {
    return all
  }
  
  const collectionMints = selectedCollection.value.collectionMints || []
  const allowedCurrencies = selectedCollection.value.allowedCurrencies || []
  
  // Extract all mint addresses from collectionMints (both tokens and NFTs)
  const collectionMintAddresses = collectionMints.map(item => 
    typeof item === 'string' ? item : item.mint
  )
  
  // Combine collection mints and allowed currencies
  const allowedMints = [...collectionMintAddresses, ...allowedCurrencies]
  
  // Filter balances to only include tokens in the allowed list
  return all.filter(token => allowedMints.includes(token.mint))
})

// Combine wallet balances with fetched wallet NFTs
// Wallet NFTs are individual NFT instances from the collection that the user owns
const displayBalances = computed(() => {
  const walletTokens = balances.value || []
  const nfts = walletNFTs.value || []
  
  // Combine wallet tokens and wallet NFTs
  // Remove duplicates (in case an NFT is also in wallet tokens)
  const allItems = [...walletTokens]
  const existingMints = new Set(walletTokens.map(t => t.mint))
  
  nfts.forEach(nft => {
    if (!existingMints.has(nft.mint)) {
      // Ensure NFT has required properties
      const nftWithProps = {
        ...nft,
        fetchingType: 'NFT',
        isCollectionItem: true
      }
      allItems.push(nftWithProps)
    }
  })
  
  return allItems
})

const loading = computed(() => tokenStore.loadingBalances)
const error = computed(() => tokenStore.balancesError)
const loadingMetadata = computed(() => tokenStore.loadingMetadata)
const showNFTSelector = ref(false)
const selectedCollectionItem = ref(null)

const handleTokenClick = (token) => {
  // If it's an NFT collection item from the selected collection, show NFT instance selector
  if (token.fetchingType === 'NFT' && token.isCollectionItem && selectedCollection.value) {
    // Find the collection item in the collection
    const collectionMints = selectedCollection.value.collectionMints || []
    const collectionItem = collectionMints.find(item => 
      typeof item === 'object' && item.mint === token.mint
    )
    
    if (collectionItem) {
      selectedCollectionItem.value = {
        ...collectionItem,
        mint: collectionItem.mint,
        name: collectionItem.name || token.name,
        fetchingType: 'NFT'
      }
      showNFTSelector.value = true
      return
    }
  }
  
  // Otherwise, select the token directly
  selectToken(token)
}

const handleNFTSelect = (nft) => {
  emit('select', nft)
  emit('close')
}

const selectToken = (token) => {
  emit('select', token)
  emit('close')
}

// Use formatBalance from utils with token decimals
const formatBalance = (balance, decimals) => {
  return formatBalanceUtil(balance, decimals || 9, false)
}
</script>
