<template>
  <BaseDropdown 
    :show="show" 
    container-class="full-screen w-full h-full bg-card-bg border border-border-color rounded-lg shadow-xl overflow-hidden flex flex-col"
    @close="$emit('close')"
  >
    <div class="p-4 border-b border-border-color flex-shrink-0">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-text-primary">{{ collectionItem.name }}</h3>
        <button
          @click="$emit('close')"
          class="text-text-muted hover:text-text-primary p-1"
        >
          <Icon icon="mdi:close" class="w-6 h-6" />
        </button>
      </div>
      <p class="text-xs text-text-muted">Select a specific NFT instance{{ source === 'wallet' ? ' from your wallet' : ' from the collection' }}</p>
    </div>

    <div class="flex-1 overflow-y-auto">
      <!-- Loading State -->
      <div v-if="loading" class="p-4 text-center text-text-muted">
        <Icon icon="svg-spinners:ring-resize" class="w-8 h-8 inline-block mb-2" />
        <p class="text-sm">{{ discovering ? 'Discovering collection...' : 'Loading NFTs...' }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-4 text-center text-text-muted">
        <Icon icon="mdi:alert-circle-outline" class="w-8 h-8 inline-block mb-2 text-status-error" />
        <p class="text-sm text-status-error">{{ error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="nfts.length === 0" class="p-4 text-center text-text-muted">
        <Icon icon="mdi:image-outline" class="w-8 h-8 inline-block mb-2" />
        <p class="text-sm">No NFTs found</p>
        <p class="text-xs mt-1">{{ source === 'wallet' ? 'No NFTs from this collection in your wallet' : 'No NFTs found in this collection' }}</p>
        <p v-if="source === 'collection' && !discoveredCollectionMint && !selectedCollection?.collectionMint" class="text-xs mt-2 text-text-muted">
          Could not discover collection mint. The NFT may not belong to a Metaplex collection.
        </p>
      </div>

      <!-- NFT Grid -->
      <div v-else class="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 overflow-y-auto">
        <button
          v-for="nft in nfts"
          :key="nft.mint"
          @click="selectNFT(nft)"
          class="group relative aspect-square rounded-lg overflow-hidden border-2 transition-all"
          :class="selectedMint === nft.mint ? 'border-primary-color' : 'border-border-color hover:border-primary-color/50'"
        >
          <img
            v-if="nft.image"
            :src="nft.image"
            :alt="nft.name"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
          <div v-else class="w-full h-full bg-secondary-bg flex items-center justify-center">
            <Icon icon="mdi:image-off" class="w-8 h-8 text-text-muted" />
          </div>
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <div v-if="source === 'wallet' && nft.balance" class="absolute top-1 right-1 bg-primary-color text-white text-xs px-1.5 py-0.5 rounded">
            {{ nft.balance }}
          </div>
        </button>
      </div>
    </div>
  </BaseDropdown>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useCollectionNFTs } from '../composables/useCollectionNFTs'
import { useWalletNFTs } from '../composables/useWalletNFTs'
import { useCollectionStore } from '../stores/collection'
import { discoverCollectionMint } from '../utils/collectionDiscovery'
import BaseDropdown from './BaseDropdown.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  collectionItem: {
    type: Object,
    required: true
  },
  source: {
    type: String,
    default: 'collection', // 'wallet' or 'collection'
    validator: (value) => ['wallet', 'collection'].includes(value)
  },
  selectedMint: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select', 'close'])

const collectionStore = useCollectionStore()
const selectedCollection = computed(() => collectionStore.selectedCollection)

// State for collection mint discovery
const discovering = ref(false)
const discoveredCollectionMint = ref(null)

// Create a mock collection object for fetching NFTs
// When clicking a collection item, we need to discover its collection mint and fetch all NFTs from that collection
const mockCollection = computed(() => {
  const baseCollection = selectedCollection.value || {}
  
  // Use parentCollectionMint if provided (from RequestTokenSelector)
  // Otherwise use the discovered collection mint from the NFT item
  const collectionMintToUse = props.collectionItem?.parentCollectionMint || 
                               discoveredCollectionMint.value
  
  return {
    ...baseCollection,
    collectionMints: [props.collectionItem],
    creatorAddress: baseCollection.creatorAddress || null,
    collectionMint: collectionMintToUse || null,
    // Store the collection item mint for discovery if needed
    _collectionItemMint: props.collectionItem?.mint || null
  }
})

// Fetch NFTs based on source
const { nfts: collectionNFTs, loading: loadingCollectionNFTs, fetchCollectionNFTs } = useCollectionNFTs(mockCollection)
const { nfts: walletNFTs, loading: loadingWalletNFTs, fetchWalletNFTs } = useWalletNFTs(mockCollection)

const nfts = computed(() => {
  return props.source === 'wallet' ? walletNFTs.value : collectionNFTs.value
})

const loading = computed(() => {
  return discovering.value || (props.source === 'wallet' ? loadingWalletNFTs.value : loadingCollectionNFTs.value)
})

const error = computed(() => {
  // Get error from the appropriate composable
  if (props.source === 'wallet') {
    // Wallet NFTs composable doesn't expose error, but we can check loading state
    return null
  } else {
    // Collection NFTs might have an error
    return null // We'll add error handling if needed
  }
})

// Watch for show prop to fetch NFTs
watch([() => props.show, () => props.collectionItem], async ([isShowing, item]) => {
  if (isShowing && item && item.fetchingType === 'NFT') {
    // Reset discovered collection mint when showing new item
    if (isShowing) {
      discoveredCollectionMint.value = null
    }
    
    if (props.source === 'wallet') {
      await fetchWalletNFTs()
    } else {
      // For collection source, assume the item mint IS the collection mint
      // The user provides the collection mint in the collectionMints array
      const collection = mockCollection.value
      
      if (collection._collectionItemMint) {
        // Directly use the item mint as the collection mint
        discoveredCollectionMint.value = collection._collectionItemMint
      }
      
      await fetchCollectionNFTs()
    }
  }
}, { immediate: true })

const selectNFT = (nft) => {
  emit('select', nft)
  emit('close')
}

const handleImageError = (event) => {
  // Hide broken image
  event.target.style.display = 'none'
}
</script>
