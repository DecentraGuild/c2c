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
          type="button"
          @click="$emit('close')"
          class="text-text-muted hover:text-text-primary p-1"
        >
          <Icon icon="mdi:close" class="w-6 h-6" />
        </button>
      </div>
      <p class="text-xs text-text-muted">Select a specific NFT instance{{ source === 'wallet' ? ' from your wallet' : ' from the collection' }}</p>
    </div>

    <!-- Search + Filters button (one row, filters hidden in dropdown) -->
    <div class="px-4 py-2 border-b border-border-color flex-shrink-0 flex items-center gap-2">
      <div class="flex-1 min-w-0">
        <BaseSearchInput
          v-model="searchQuery"
          placeholder="Search by name, number, or mint..."
          container-class=""
          inputClass="text-sm"
        />
      </div>
      <!-- Filters: single button opens dropdown (works for any collection size) -->
      <div v-if="hasAnyTraits" ref="filterContainerRef" class="relative flex-shrink-0">
        <button
          type="button"
          @click="filtersDropdownOpen = !filtersDropdownOpen"
          class="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-color bg-secondary-bg text-text-primary hover:border-primary-color/50 transition-colors text-sm"
          :class="hasActiveTraitFilters ? 'border-primary-color/50' : ''"
        >
          <Icon icon="mdi:filter-outline" class="w-4 h-4" />
          <span>Filters</span>
          <span v-if="activeFilterCount" class="min-w-[1.25rem] h-5 px-1 rounded-full bg-primary-color text-white text-xs flex items-center justify-center">
            {{ activeFilterCount }}
          </span>
          <Icon icon="mdi:chevron-down" class="w-4 h-4 transition-transform" :class="filtersDropdownOpen ? 'rotate-180' : ''" />
        </button>
        <!-- Dropdown panel: scrollable list of trait types and values -->
        <div
          v-show="filtersDropdownOpen"
          class="absolute right-0 top-full mt-1 z-[60] min-w-[240px] max-w-[min(90vw,320px)] max-h-[min(60vh,320px)] overflow-y-auto overflow-x-hidden collection-scroll-container bg-card-bg border border-border-color rounded-lg shadow-xl py-2"
        >
          <div class="collection-scroll-content">
          <div class="px-3 pb-2 border-b border-border-color flex items-center justify-between sticky top-0 bg-card-bg z-10">
            <span class="text-xs font-medium text-text-muted">Filter by traits</span>
            <button
              v-if="hasActiveTraitFilters"
              type="button"
              @click="clearTraitFilters(); filtersDropdownOpen = false"
              class="text-xs text-primary-color hover:underline"
            >
              Clear all
            </button>
          </div>
          <div class="py-2">
            <div
              v-for="(values, traitType) in uniqueTraits"
              :key="traitType"
              class="px-3 py-1.5"
            >
              <p class="text-xs font-medium text-text-muted mb-1.5 truncate" :title="traitType">{{ traitType }}</p>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="val in values"
                  :key="`${traitType}-${val}`"
                  type="button"
                  @click="toggleTraitFilter(traitType, val)"
                  class="px-2 py-0.5 text-xs rounded border transition-colors truncate max-w-full"
                  :class="selectedTraitFilters[traitType] === val
                    ? 'bg-primary-color text-white border-primary-color'
                    : 'bg-secondary-bg border-border-color text-text-primary hover:border-primary-color/50'"
                >
                  {{ val }}
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto collection-scroll-container">
      <div class="collection-scroll-content">
      <!-- Loading -->
      <div v-if="loading" class="p-4 text-center text-text-muted">
        <Icon icon="svg-spinners:ring-resize" class="w-8 h-8 inline-block mb-2" />
        <p class="text-sm">{{ discovering ? 'Discovering collection...' : 'Loading NFTs...' }}</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="p-4 text-center text-text-muted">
        <Icon icon="mdi:alert-circle-outline" class="w-8 h-8 inline-block mb-2 text-status-error" />
        <p class="text-sm text-status-error">{{ error }}</p>
      </div>

      <!-- Empty: no NFTs at all -->
      <div v-else-if="nfts.length === 0" class="p-4 text-center text-text-muted">
        <Icon icon="mdi:image-outline" class="w-8 h-8 inline-block mb-2" />
        <p class="text-sm">No NFTs found</p>
        <p class="text-xs mt-1">{{ source === 'wallet' ? 'No NFTs from this collection in your wallet' : 'No NFTs found in this collection' }}</p>
        <p v-if="source === 'collection' && !discoveredCollectionMint && !selectedStorefront?.collectionMint" class="text-xs mt-2 text-text-muted">
          Could not discover collection mint. The NFT may not belong to a Metaplex collection.
        </p>
      </div>

      <!-- Empty: search or filters returned no match -->
      <div v-else-if="filteredNfts.length === 0" class="p-4 text-center text-text-muted">
        <Icon icon="mdi:filter-off-outline" class="w-8 h-8 inline-block mb-2" />
        <p class="text-sm">{{ hasActiveTraitFilters ? 'No NFTs match the selected filters' : 'No NFTs match your search' }}</p>
        <button
          type="button"
          @click="clearSearchAndFilters"
          class="mt-2 text-sm text-primary-color hover:underline"
        >
          Clear search and filters
        </button>
      </div>

      <!-- NFT Grid: rectangle cards with image + name + traits -->
      <div v-else class="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <button
          v-for="nft in filteredNfts"
          :key="nft.mint"
          type="button"
          @click="selectNFT(nft)"
          class="group text-left rounded-lg overflow-hidden border-2 transition-all bg-secondary-bg/30"
          :class="selectedMint === nft.mint ? 'border-primary-color' : 'border-border-color hover:border-primary-color/50'"
        >
          <!-- Image: fixed height rectangle -->
          <div class="relative w-full aspect-[4/3] bg-secondary-bg overflow-hidden">
            <img
              v-if="nft.image"
              :src="nft.image"
              :alt="nft.name"
              class="w-full h-full object-cover"
              @error="handleImageError"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon icon="mdi:image-off" class="w-10 h-10 text-text-muted" />
            </div>
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div v-if="source === 'wallet' && nft.balance" class="absolute top-1 right-1 bg-primary-color text-white text-xs px-1.5 py-0.5 rounded">
              {{ nft.balance }}
            </div>
          </div>
          <!-- Name -->
          <div class="px-2 py-1.5 border-t border-border-color">
            <p class="text-sm font-medium text-text-primary truncate" :title="nft.name">
              {{ nft.name || `#${nft.mint.slice(0, 8)}...` }}
            </p>
            <!-- Traits -->
            <div v-if="displayTraits(nft).length" class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="(attr, idx) in displayTraits(nft).slice(0, 4)"
                :key="idx"
                class="inline-block px-1.5 py-0.5 text-xs rounded bg-secondary-bg border border-border-color text-text-muted"
              >
                {{ attr.trait_type }}: {{ attr.value }}
              </span>
              <span
                v-if="displayTraits(nft).length > 4"
                class="inline-block px-1.5 py-0.5 text-xs text-text-muted"
              >
                +{{ displayTraits(nft).length - 4 }} more
              </span>
            </div>
          </div>
        </button>
      </div>
      </div>
    </div>
  </BaseDropdown>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useCollectionNFTs } from '@/composables/useCollectionNFTs'
import { useWalletNFTs } from '@/composables/useWalletNFTs'
import { useStorefrontStore } from '@/stores/storefront'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import { DEBOUNCE_DELAYS } from '@/utils/constants'
import { filterNFTsBySearch, filterNFTsByTraits, getUniqueTraits, normaliseAttributes } from '@/utils/nftFilterHelpers'
import BaseDropdown from './BaseDropdown.vue'
import BaseSearchInput from './BaseSearchInput.vue'

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
    default: 'collection',
    validator: (value) => ['wallet', 'collection'].includes(value)
  },
  selectedMint: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select', 'close'])

const storefrontStore = useStorefrontStore()
const selectedStorefront = computed(() => storefrontStore.selectedStorefront)

const searchQuery = ref('')
const { debouncedQuery } = useDebouncedSearch(searchQuery, { delay: DEBOUNCE_DELAYS.MEDIUM })

const selectedTraitFilters = ref({})
const filtersDropdownOpen = ref(false)
const filterContainerRef = ref(null)

/** Number of active trait filters (for badge) */
const activeFilterCount = computed(() => Object.keys(selectedTraitFilters.value).length)

const discovering = ref(false)
const discoveredCollectionMint = ref(null)

const mockCollection = computed(() => {
  const baseCollection = selectedStorefront.value || {}
  const collectionMintToUse = props.collectionItem?.parentCollectionMint ?? discoveredCollectionMint.value
  return {
    ...baseCollection,
    collectionMints: [props.collectionItem],
    creatorAddress: baseCollection.creatorAddress || null,
    collectionMint: collectionMintToUse || null,
    _collectionItemMint: props.collectionItem?.mint || null
  }
})

const { nfts: collectionNFTs, loading: loadingCollectionNFTs, fetchCollectionNFTs } = useCollectionNFTs(mockCollection)
const { nfts: walletNFTs, loading: loadingWalletNFTs, fetchWalletNFTs } = useWalletNFTs(mockCollection)

const nfts = computed(() => {
  return props.source === 'wallet' ? walletNFTs.value : collectionNFTs.value
})

const loading = computed(() => {
  return discovering.value || (props.source === 'wallet' ? loadingWalletNFTs.value : loadingCollectionNFTs.value)
})

const error = computed(() => (props.source === 'wallet' ? null : null))

const uniqueTraits = computed(() => getUniqueTraits(nfts.value))

const hasAnyTraits = computed(() => Object.keys(uniqueTraits.value).length > 0)

const hasActiveTraitFilters = computed(() => Object.keys(selectedTraitFilters.value).length > 0)

const afterSearch = computed(() => filterNFTsBySearch(nfts.value, debouncedQuery.value))

const filteredNfts = computed(() => filterNFTsByTraits(afterSearch.value, selectedTraitFilters.value))

function displayTraits(nft) {
  return normaliseAttributes(nft.attributes ?? [])
}

function toggleTraitFilter(traitType, value) {
  const next = { ...selectedTraitFilters.value }
  if (next[traitType] === value) {
    delete next[traitType]
  } else {
    next[traitType] = value
  }
  selectedTraitFilters.value = next
}

function clearTraitFilters() {
  selectedTraitFilters.value = {}
}

function clearSearchAndFilters() {
  searchQuery.value = ''
  selectedTraitFilters.value = {}
}

watch([() => props.show, () => props.collectionItem], async ([isShowing, item]) => {
  if (isShowing && item && item.fetchingType === 'NFT') {
    if (isShowing) {
      discoveredCollectionMint.value = null
    }
    if (props.source === 'wallet') {
      await fetchWalletNFTs()
    } else {
      const collection = mockCollection.value
      if (collection._collectionItemMint) {
        discoveredCollectionMint.value = collection._collectionItemMint
      }
      await fetchCollectionNFTs()
    }
  }
}, { immediate: true })

watch(() => props.show, (isShowing) => {
  if (!isShowing) {
    searchQuery.value = ''
    selectedTraitFilters.value = {}
    filtersDropdownOpen.value = false
  }
})

// Close filters dropdown when clicking outside (any collection; dropdown is scrollable inside)
let removeClickOutside = null
watch(filtersDropdownOpen, (open) => {
  removeClickOutside?.()
  if (!open) return
  const close = (e) => {
    if (filterContainerRef.value && !filterContainerRef.value.contains(e.target)) {
      filtersDropdownOpen.value = false
      document.removeEventListener('click', close)
      removeClickOutside = null
    }
  }
  removeClickOutside = () => {
    document.removeEventListener('click', close)
    removeClickOutside = null
  }
  setTimeout(() => document.addEventListener('click', close), 0)
})
onUnmounted(() => removeClickOutside?.())

function selectNFT(nft) {
  emit('select', nft)
  emit('close')
}

function handleImageError(event) {
  event.target.style.display = 'none'
}
</script>
