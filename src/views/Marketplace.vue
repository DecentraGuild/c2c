<template>
  <div class="min-h-screen bg-primary-bg py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-full mx-auto">
      <!-- Header -->
      <div class="mb-3 sm:mb-4">
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-base sm:text-lg font-bold text-text-primary">Marketplace</h1>
          <CollectionBadge
            v-if="selectedStorefront"
            :verification-status="selectedStorefront.verification_status || (selectedStorefront.verified ? 'verified' : 'community')"
          />
        </div>
        <p v-if="selectedStorefront" class="text-xs sm:text-sm text-text-secondary mt-0.5">
          Viewing trades for <span class="font-semibold">{{ selectedStorefront.name }}</span>
        </p>
        <p v-else class="text-xs sm:text-sm text-text-muted mt-0.5">
          Select a storefront from the navbar to view marketplace trades
        </p>
      </div>

      <!-- Main Content with Sidebar -->
      <div v-if="selectedStorefront" class="flex gap-4">
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
            :storefront="selectedStorefront"
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
              :storefront="selectedStorefront"
              :user-balances="userBalances"
              section-class="mb-4"
            />

            <!-- Other Open Trades -->
            <MarketplaceEscrowSection
              :escrows="otherEscrows"
              :title="userFillableEscrows.length > 0 ? 'All Open Trades' : null"
              :view-mode="viewMode"
              :storefront="selectedStorefront"
              :user-balances="userBalances"
            />
          </div>

          <!-- Empty State -->
          <BaseEmptyState
            v-else-if="selectedStorefront"
            title="No open trades found"
            :message="selectedTradeType === 'all' 
              ? 'There are no active trades for this storefront' 
              : `There are no ${tradeTypes.find(t => t.value === selectedTradeType)?.label.toLowerCase()} orders for this storefront`"
          />
        </div>
      </div>

      <!-- No storefront selected -->
      <BaseEmptyState
        v-else
        icon="mdi:store-outline"
        title="Select a storefront to view trades"
        message="Choose a storefront from the navbar to see available trades"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseLoading from '@/components/BaseLoading.vue'
import BaseSearchInput from '@/components/BaseSearchInput.vue'
import BaseViewModeToggle from '@/components/BaseViewModeToggle.vue'
import BaseEmptyState from '@/components/BaseEmptyState.vue'
import MarketplaceEscrowSection from '@/components/MarketplaceEscrowSection.vue'
import MarketplaceFilters from '@/components/MarketplaceFilters.vue'
import CollectionBadge from '@/components/CollectionBadge.vue'
import { useStorefrontStore } from '@/stores/storefront'
import { useEscrowStore } from '@/stores/escrow'
import { useWalletBalances } from '@/composables/useWalletBalances'
import { useViewMode } from '@/composables/useViewMode'
import useMarketplaceFilters from '@/composables/useMarketplaceFilters'
import { logDebug } from '@/utils/logger'

const route = useRoute()
const router = useRouter()
const storefrontStore = useStorefrontStore()
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
const storefronts = computed(() => storefrontStore.storefronts || [])

const selectedStorefront = computed(() => {
  const selectedId = storefrontStore.selectedStorefrontId
  if (!selectedId) return null
  return storefronts.value.find(s => s.id === selectedId)
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
  selectedStorefront,
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
  if (!selectedStorefront.value) return
  if (isLoadingEscrowsFlag) {
    logDebug('Escrows already loading, skipping duplicate call')
    return
  }
  isLoadingEscrowsFlag = true
  try {
    await escrowStore.loadAllEscrows()
    storefrontStore.refreshOpenTradesCounts(escrowStore.escrows)
    logDebug(`Loaded ${escrowStore.escrows.length} escrows for marketplace`)
  } finally {
    isLoadingEscrowsFlag = false
  }
}

let lastLoadedStorefrontId = null

watch(() => storefrontStore.selectedStorefrontId, (newStorefrontId) => {
  if (newStorefrontId && route.path === '/marketplace') {
    if (route.query.storefront !== newStorefrontId) {
      router.replace({ query: { storefront: newStorefrontId } })
    }
    if (newStorefrontId !== lastLoadedStorefrontId) {
      clearFilters()
      loadEscrows()
      lastLoadedStorefrontId = newStorefrontId
    }
  }
})

watch(() => route.query.storefront, (newStorefrontId) => {
  if (newStorefrontId && newStorefrontId !== storefrontStore.selectedStorefrontId) {
    storefrontStore.setSelectedStorefront(newStorefrontId)
    clearFilters()
    if (newStorefrontId !== lastLoadedStorefrontId) {
      loadEscrows()
      lastLoadedStorefrontId = newStorefrontId
    }
  }
}, { immediate: true })

// Watch for wallet connection to reload balances
watch(() => balances.value, () => {
  // Balances updated, escrows will automatically re-sort via computed
}, { deep: true })

onMounted(async () => {
  if (storefronts.value.length === 0) {
    await storefrontStore.loadStorefronts()
  }
  if (route.query.storefront) {
    storefrontStore.setSelectedStorefront(route.query.storefront)
    loadEscrows()
  } else if (storefrontStore.selectedStorefrontId) {
    router.replace({ query: { storefront: storefrontStore.selectedStorefrontId } })
    loadEscrows()
  } else if (storefronts.value.length > 0) {
    storefrontStore.setSelectedStorefront(storefronts.value[0].id)
    router.replace({ query: { storefront: storefronts.value[0].id } })
    loadEscrows()
  }
  await fetchBalances()
})
</script>
