<template>
  <div class="min-h-screen bg-primary-bg py-3 sm:py-4 px-3 sm:px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-4 sm:mb-6">
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-xl sm:text-2xl font-bold text-text-primary">Marketplace</h1>
          <CollectionBadge
            v-if="selectedCollection"
            :verification-status="selectedCollection.verification_status || (selectedCollection.verified ? 'verified' : 'community')"
          />
        </div>
        <p v-if="selectedCollection" class="text-sm text-text-secondary mt-1">
          Viewing trades for <span class="font-semibold">{{ selectedCollection.name }}</span>
        </p>
        <p v-else class="text-sm text-text-muted mt-1">
          Select a collection from the navbar to view marketplace trades
        </p>
      </div>

      <!-- Main Content with Sidebar -->
      <div v-if="selectedCollection" class="flex gap-4 sm:gap-6">
        <!-- Sidebar -->
        <aside class="hidden lg:block w-64 flex-shrink-0 space-y-4">
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
          <div class="mb-4">
            <div class="card p-3">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <!-- Trade Type Filters -->
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    v-for="type in tradeTypes"
                    :key="type.value"
                    @click="selectedTradeType = type.value"
                    :class="[
                      'px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
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
              @click="loadEscrows"
              class="mt-4 px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-primary-color/90 transition-colors text-sm font-semibold"
            >
              Retry
            </button>
          </BaseEmptyState>

          <!-- Escrows List/Cards -->
          <div v-else-if="filteredEscrows.length > 0">
            <!-- User's Fillable Trades First -->
            <div v-if="userFillableEscrows.length > 0" class="mb-6">
              <h2 class="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Icon icon="mdi:star" class="w-5 h-5 text-primary-color" />
                <span>You Can Fill ({{ userFillableEscrows.length }})</span>
              </h2>
              <!-- Card View -->
              <div v-if="viewMode === 'card'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <MarketplaceEscrowCard
                  v-for="escrow in userFillableEscrows"
                  :key="escrow.id"
                  :escrow="escrow"
                  :collection="selectedCollection"
                  :user-balances="userBalances"
                  :view-mode="viewMode"
                />
              </div>
              <!-- List View -->
              <div v-else class="space-y-3">
                <MarketplaceEscrowCard
                  v-for="escrow in userFillableEscrows"
                  :key="escrow.id"
                  :escrow="escrow"
                  :collection="selectedCollection"
                  :user-balances="userBalances"
                  :view-mode="viewMode"
                />
              </div>
            </div>

            <!-- Other Open Trades -->
            <div v-if="otherEscrows.length > 0">
              <h2 v-if="userFillableEscrows.length > 0" class="text-lg font-semibold text-text-primary mb-3">
                All Open Trades ({{ otherEscrows.length }})
              </h2>
              <!-- Card View -->
              <div v-if="viewMode === 'card'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <MarketplaceEscrowCard
                  v-for="escrow in otherEscrows"
                  :key="escrow.id"
                  :escrow="escrow"
                  :collection="selectedCollection"
                  :user-balances="userBalances"
                  :view-mode="viewMode"
                />
              </div>
              <!-- List View -->
              <div v-else class="space-y-3">
                <MarketplaceEscrowCard
                  v-for="escrow in otherEscrows"
                  :key="escrow.id"
                  :escrow="escrow"
                  :collection="selectedCollection"
                  :user-balances="userBalances"
                  :view-mode="viewMode"
                />
              </div>
            </div>
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
import { ref, computed, watch, onMounted, shallowRef } from 'vue'
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import BaseLoading from '../components/BaseLoading.vue'
import BaseSearchInput from '../components/BaseSearchInput.vue'
import BaseViewModeToggle from '../components/BaseViewModeToggle.vue'
import BaseEmptyState from '../components/BaseEmptyState.vue'
import MarketplaceEscrowCard from '../components/MarketplaceEscrowCard.vue'
import MarketplaceFilters from '../components/MarketplaceFilters.vue'
import CollectionBadge from '../components/CollectionBadge.vue'
import { useCollectionStore } from '../stores/collection'
import { useWalletBalances } from '../composables/useWalletBalances'
import { useViewMode } from '../composables/useViewMode'
import { useMarketplaceFilters } from '../composables/useMarketplaceFilters'
import { fetchAllEscrows } from '../utils/escrowTransactions'
import { useSolanaConnection } from '../composables/useSolanaConnection'
import { useTokenStore } from '../stores/token'
import { formatEscrowData } from '../utils/escrowHelpers'
import { logError, logDebug } from '../utils/logger'

const route = useRoute()
const router = useRouter()
const collectionStore = useCollectionStore()
const connection = useSolanaConnection()
const tokenStore = useTokenStore()
const { balances, fetchBalances } = useWalletBalances({ autoFetch: true })
const { viewMode } = useViewMode('marketplace-view-mode', 'list')

// State
const selectedTradeType = ref('all')
const loadingEscrows = ref(false)
const escrowsError = ref(null)
// Use shallowRef for large arrays to improve performance
const allEscrows = shallowRef([])
const activeFilters = ref(new Set()) // Set of "itemType:class" strings
const searchQuery = ref('')

const viewModes = [
  { value: 'list', label: 'List view', icon: 'mdi:view-list' },
  { value: 'card', label: 'Card view', icon: 'mdi:view-grid' }
]

// Trade types
const tradeTypes = [
  { value: 'all', label: 'All' },
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
  { value: 'trade', label: 'Trade' }
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

const loadEscrows = async () => {
  if (!selectedCollection.value) {
    allEscrows.value = []
    loadingEscrows.value = false
    return
  }

  // Validate connection before proceeding
  if (!connection) {
    logError('Solana connection not available')
    escrowsError.value = 'Solana connection not available'
    loadingEscrows.value = false
    return
  }

  loadingEscrows.value = true
  escrowsError.value = null

  try {
    // Fetch all escrows from blockchain
    const rawEscrows = await fetchAllEscrows(connection, null)
    
    // Safety check: ensure rawEscrows is an array
    if (!rawEscrows || !Array.isArray(rawEscrows)) {
      logError('fetchAllEscrows returned invalid data:', rawEscrows)
      allEscrows.value = []
      escrowsError.value = 'Invalid data received from blockchain'
      return
    }
    
    // Format escrows with token information
    // Process in batches to avoid blocking the UI for too long
    const batchSize = 20
    const formattedEscrows = []
    
    for (let i = 0; i < rawEscrows.length; i += batchSize) {
      const batch = rawEscrows.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (escrowData) => {
          try {
            if (!escrowData || !escrowData.account || !escrowData.publicKey) {
              logError('Invalid escrow data:', escrowData)
              return null
            }
            
            const escrowAccount = escrowData.account
            const escrowPubkey = escrowData.publicKey
            
            // Fetch token info for deposit and request tokens
            const [depositTokenInfo, requestTokenInfo] = await Promise.all([
              tokenStore.fetchTokenInfo(escrowAccount.depositToken.toString()),
              tokenStore.fetchTokenInfo(escrowAccount.requestToken.toString())
            ])
            
            // Format escrow data using helper function
            return formatEscrowData(
              { account: escrowAccount, publicKey: escrowPubkey },
              depositTokenInfo,
              requestTokenInfo
            )
          } catch (err) {
            logError('Failed to format escrow:', err)
            return null
          }
        })
      )
      
      // Filter out null values and add to results
      const validResults = batchResults.filter(e => e !== null)
      formattedEscrows.push(...validResults)
      
      // Update UI incrementally for better UX
      if (i === 0 || i % (batchSize * 3) === 0) {
        allEscrows.value = [...formattedEscrows]
      }
    }
    
    // Final update with all escrows
    allEscrows.value = formattedEscrows
    
    logDebug(`Loaded ${formattedEscrows.length} escrows for marketplace`)
  } catch (err) {
    logError('Failed to load escrows:', err)
    escrowsError.value = err.message || 'Failed to load marketplace trades'
    allEscrows.value = []
  } finally {
    loadingEscrows.value = false
  }
}

// Watch for collection changes from store
watch(() => collectionStore.selectedCollectionId, (newCollectionId) => {
  if (newCollectionId && route.path === '/marketplace') {
    // Update URL to match store
    router.replace({ query: { collection: newCollectionId } })
    // Clear filters and search when collection changes
    clearFilters()
    loadEscrows()
  }
})

// Watch for collection changes from URL
watch(() => route.query.collection, (newCollectionId) => {
  if (newCollectionId && newCollectionId !== collectionStore.selectedCollectionId) {
    collectionStore.setSelectedCollection(newCollectionId)
    // Clear filters and search when collection changes
    clearFilters()
    loadEscrows()
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
