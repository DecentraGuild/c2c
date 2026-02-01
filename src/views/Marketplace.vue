<template>
  <div class="min-h-screen bg-primary-bg py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-full mx-auto">
      <!-- Header -->
      <div class="mb-3 sm:mb-4">
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-base sm:text-lg font-bold text-text-primary">Marketplace</h1>
          <CollectionBadge
            v-if="selectedCollection"
            :verification-status="selectedCollection.verification_status || (selectedCollection.verified ? 'verified' : 'community')"
          />
        </div>
        <p v-if="selectedCollection" class="text-xs sm:text-sm text-text-secondary mt-0.5">
          Viewing trades for <span class="font-semibold">{{ selectedCollection.name }}</span>
        </p>
        <p v-else class="text-xs sm:text-sm text-text-muted mt-0.5">
          Select a collection from the navbar to view marketplace trades
        </p>
      </div>

      <!-- Main Content with Sidebar -->
      <div v-if="selectedCollection" class="flex gap-4">
        <!-- Sidebar -->
        <aside class="hidden lg:block w-56 flex-shrink-0 space-y-3">
          <!-- Search Bar -->
          <div class="card p-3">
            <BaseSearchInput
              v-model="searchQuery"
              placeholder="Search orders by ID, maker address, or token name..."
            />
          </div>
          
          <!-- Filters -->
          <MarketplaceFilters
            :collection="selectedCollection"
            :escrows="allEscrows"
            @update:activeFilters="handleActiveFiltersUpdate"
          />
        </aside>

        <!-- Main Content -->
        <div class="flex-1 min-w-0">
          <!-- Trade Type Filters and View Toggle -->
          <div class="mb-3">
            <div class="card p-2.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <!-- Trade Type Filters -->
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    v-for="type in tradeTypes"
                    :key="type.value"
                    @click="selectedTradeType = type.value"
                    :class="[
                      'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
                      selectedTradeType === type.value
                        ? 'bg-primary-color text-white shadow-sm'
                        : 'bg-secondary-bg text-text-secondary hover:bg-secondary-bg/80 hover:text-text-primary'
                    ]"
                  >
                    {{ type.label }}
                  </button>
                </div>
                
                <!-- View Mode Toggle -->
                <BaseViewModeToggle
                  v-model="viewMode"
                  :modes="viewModes"
                />
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <BaseLoading v-if="loadingEscrows" message="Loading marketplace trades..." />

          <!-- Error State -->
          <BaseEmptyState
            v-else-if="escrowsError"
            icon="mdi:alert-circle"
            :title="escrowsError"
            title-class="text-status-error"
          >
            <button
              @click="escrowStore.loadAllEscrows"
              class="mt-4 px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-primary-color/90 transition-colors text-sm font-semibold"
            >
              Retry
            </button>
          </BaseEmptyState>

          <!-- Escrows List/Cards -->
          <div v-else-if="filteredEscrows.length > 0">
            <!-- User's Fillable Trades First -->
            <MarketplaceEscrowSection
              :escrows="userFillableEscrows"
              title="You Can Fill"
              icon="mdi:star"
              icon-class="text-primary-color"
              :view-mode="viewMode"
              :collection="selectedCollection"
              :user-balances="userBalances"
              section-class="mb-4"
            />

            <!-- Other Open Trades -->
            <MarketplaceEscrowSection
              :escrows="otherEscrows"
              :title="userFillableEscrows.length > 0 ? 'All Open Trades' : null"
              :view-mode="viewMode"
              :collection="selectedCollection"
              :user-balances="userBalances"
            />
          </div>

          <!-- Empty State -->
          <BaseEmptyState
            v-else-if="selectedCollection"
            title="No open trades found"
            :message="selectedTradeType === 'all' 
              ? 'There are no active trades for this collection' 
              : `There are no ${tradeTypes.find(t => t.value === selectedTradeType)?.label.toLowerCase()} orders for this collection`"
          />
        </div>
      </div>

      <!-- No Collection Selected -->
      <BaseEmptyState
        v-else
        icon="mdi:store-outline"
        title="Select a collection to view marketplace"
        message="Choose a collection from the dropdown above to see available trades"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseLoading from '../components/BaseLoading.vue'
import BaseSearchInput from '../components/BaseSearchInput.vue'
import BaseViewModeToggle from '../components/BaseViewModeToggle.vue'
import BaseEmptyState from '../components/BaseEmptyState.vue'
import MarketplaceEscrowSection from '../components/MarketplaceEscrowSection.vue'
import MarketplaceFilters from '../components/MarketplaceFilters.vue'
import CollectionBadge from '../components/CollectionBadge.vue'
import { useCollectionStore } from '../stores/collection'
import { useEscrowStore } from '../stores/escrow'
import { useWalletBalances } from '../composables/useWalletBalances'
import { useViewMode } from '../composables/useViewMode'
import useMarketplaceFilters from '../composables/useMarketplaceFilters'
import { logDebug } from '../utils/logger'

const route = useRoute()
const router = useRouter()
const collectionStore = useCollectionStore()
const escrowStore = useEscrowStore()
const { balances, fetchBalances } = useWalletBalances({ autoFetch: true })
const { viewMode } = useViewMode('marketplace-view-mode', 'list')

// State
const selectedTradeType = ref('all')
const activeFilters = ref(new Set()) // Set of "itemType:class" strings
const searchQuery = ref('')

// Use escrows from the store
const allEscrows = computed(() => escrowStore.escrows || [])
const loadingEscrows = computed(() => escrowStore.loadingEscrows)
const escrowsError = computed(() => escrowStore.errors.escrows)

const viewModes = [
  { value: 'list', label: 'List view', icon: 'mdi:view-list' },
  { value: 'card', label: 'Card view', icon: 'mdi:view-grid' }
]

// Trade types
const tradeTypes = [
  { value: 'all', label: 'All' },
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
  { value: 'trade', label: 'Trade' },
  { value: 'swap', label: 'Swap' }
]

// Computed
const collections = computed(() => collectionStore.collections || [])

const selectedCollection = computed(() => {
  const selectedId = collectionStore.selectedCollectionId
  if (!selectedId) return null
  return collections.value.find(c => c.id === selectedId)
})

// User balances as a map for quick lookup
const userBalances = computed(() => {
  const balanceMap = {}
  if (balances.value) {
    balances.value.forEach(token => {
      balanceMap[token.mint] = token.balance || 0
    })
  }
  return balanceMap
})

// Use marketplace filters composable for optimized filtering
const {
  filteredEscrows,
  userFillableEscrows,
  otherEscrows
} = useMarketplaceFilters({
  allEscrows,
  selectedCollection,
  selectedTradeType,
  userBalances,
  activeFilters,
  searchQuery
})

// Methods
const handleActiveFiltersUpdate = (newFilters) => {
  activeFilters.value = newFilters
}

const clearFilters = () => {
  activeFilters.value.clear()
  searchQuery.value = ''
}

// Track if loadEscrows is in progress to prevent duplicate calls
let isLoadingEscrowsFlag = false

const loadEscrows = async () => {
  if (!selectedCollection.value) {
    return
  }
  
  // Prevent duplicate simultaneous calls
  if (isLoadingEscrowsFlag) {
    logDebug('Escrows already loading, skipping duplicate call')
    return
  }

  isLoadingEscrowsFlag = true
  try {
    // Load all escrows from blockchain via escrow store
    await escrowStore.loadAllEscrows()
    
    // Update collection counts after loading (pass escrows directly)
    collectionStore.refreshOpenTradesCounts(escrowStore.escrows)
    
    logDebug(`Loaded ${escrowStore.escrows.length} escrows for marketplace`)
  } finally {
    isLoadingEscrowsFlag = false
  }
}

// Track last loaded collection to prevent duplicate loads
let lastLoadedCollectionId = null

// Watch for collection changes from store
watch(() => collectionStore.selectedCollectionId, (newCollectionId) => {
  if (newCollectionId && route.path === '/marketplace') {
    // Only update URL if it's different (prevent circular updates)
    if (route.query.collection !== newCollectionId) {
      router.replace({ query: { collection: newCollectionId } })
    }
    
    // Only load escrows if collection actually changed
    if (newCollectionId !== lastLoadedCollectionId) {
      // Clear filters and search when collection changes
      clearFilters()
      loadEscrows()
      lastLoadedCollectionId = newCollectionId
    }
  }
})

// Watch for collection changes from URL
watch(() => route.query.collection, (newCollectionId) => {
  if (newCollectionId && newCollectionId !== collectionStore.selectedCollectionId) {
    collectionStore.setSelectedCollection(newCollectionId)
    // Clear filters and search when collection changes
    clearFilters()
    // Only load if not already loading for this collection
    if (newCollectionId !== lastLoadedCollectionId) {
      loadEscrows()
      lastLoadedCollectionId = newCollectionId
    }
  }
}, { immediate: true })

// Watch for wallet connection to reload balances
watch(() => balances.value, () => {
  // Balances updated, escrows will automatically re-sort via computed
}, { deep: true })

// Load collections on mount
onMounted(async () => {
  // Load collections if not already loaded
  if (collections.value.length === 0) {
    await collectionStore.loadCollections()
  }
  
  // Set initial collection from URL or store
  if (route.query.collection) {
    collectionStore.setSelectedCollection(route.query.collection)
    loadEscrows()
  } else if (collectionStore.selectedCollectionId) {
    // Use store selection
    router.replace({ query: { collection: collectionStore.selectedCollectionId } })
    loadEscrows()
  } else if (collections.value.length > 0) {
    // Auto-select first collection
    collectionStore.setSelectedCollection(collections.value[0].id)
    router.replace({ query: { collection: collections.value[0].id } })
    loadEscrows()
  }
  
  // Fetch user balances
  await fetchBalances()
})
</script>
