<template>
  <div class="min-h-screen bg-primary-bg py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-6xl mx-auto">
      <!-- Hero Section -->
      <div class="text-center mb-6 sm:mb-8">
        <h1 class="text-xl sm:text-2xl font-bold text-text-primary mb-2 sm:mb-3 leading-tight">
          Explore Marketplaces Across the Solana Ecosystem
        </h1>
        <p class="max-w-2xl mx-auto text-sm sm:text-base text-text-secondary mb-4 leading-relaxed">
          Buy, sell, and trade across official and community-run storefronts, each with their own branding, collections, currencies, and pricing.
        </p>
      </div>

      <!-- Marketplaces Section -->
      <div class="mb-6">
        <!-- Title, Search Bar, and View Toggle - All on One Row, Same Width as Marketplaces -->
        <div class="flex items-center gap-2 sm:gap-3 mb-3">
          <!-- Title - Left -->
          <h2 class="text-base sm:text-lg font-bold text-text-primary flex-shrink-0">Marketplaces</h2>
          
          <!-- Search Bar - Center (flexible, takes remaining space) -->
          <BaseSearchInput
            v-model="searchQuery"
            placeholder="Search marketplaces..."
            container-class="flex-1"
          />
          
          <!-- View Mode Toggle - Right -->
          <BaseViewModeToggle
            v-model="viewMode"
            :modes="viewModes"
          />
          
          <!-- Create Marketplace Button -->
          <router-link
            to="/onboard"
            class="flex-shrink-0 px-3 py-2 bg-primary-color text-white rounded-lg hover:bg-primary-color/90 transition-colors text-sm font-semibold flex items-center gap-2"
          >
            <Icon icon="mdi:plus-circle" class="w-4 h-4" />
            <span class="hidden sm:inline">Create Marketplace</span>
            <span class="sm:hidden">Create</span>
          </router-link>
        </div>

        <!-- Loading State -->
        <BaseLoading v-if="collectionStore.loadingCollections" message="Loading marketplaces..." />

        <!-- Error State -->
        <BaseEmptyState
          v-else-if="collectionStore.error"
          icon="mdi:alert-circle"
          :title="collectionStore.error"
          title-class="text-status-error"
        />

        <!-- Marketplaces Grid/List -->
        <div v-else-if="filteredCollections.length > 0">
          <!-- Tile View -->
          <div v-if="viewMode === 'tile'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            <!-- Cards will auto-size based on grid, max ~280-320px each -->
            <CollectionCard
              v-for="collection in filteredCollections"
              :key="collection.id"
              :collection="collection"
              :open-trades="collectionStore.getOpenTradesCount(collection.id)"
            />
          </div>

          <!-- List View -->
          <div v-else class="space-y-3">
            <CollectionListItem
              v-for="collection in filteredCollections"
              :key="collection.id"
              :collection="collection"
              :open-trades="collectionStore.getOpenTradesCount(collection.id)"
            />
          </div>
        </div>

        <!-- Empty State -->
        <BaseEmptyState
          v-else
          :title="searchQuery ? 'No marketplaces found matching your search' : 'No marketplaces available'"
          :message="searchQuery ? 'Try a different search term' : 'Marketplaces will appear here once they register'"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import BaseLoading from '../components/BaseLoading.vue'
import BaseSearchInput from '../components/BaseSearchInput.vue'
import BaseViewModeToggle from '../components/BaseViewModeToggle.vue'
import BaseEmptyState from '../components/BaseEmptyState.vue'
import CollectionCard from '../components/CollectionCard.vue'
import CollectionListItem from '../components/CollectionListItem.vue'
import { useCollectionStore } from '@/stores/collection'
import { useEscrowStore } from '@/stores/escrow'
import { useViewMode } from '@/composables/useViewMode'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import { filterCollectionsByQuery } from '@/utils/collectionHelpers'

const collectionStore = useCollectionStore()
const escrowStore = useEscrowStore()
const { viewMode } = useViewMode('dashboard-view-mode', 'tile')
const searchQuery = ref('')
const { debouncedQuery: debouncedSearchQuery } = useDebouncedSearch(searchQuery)

const viewModes = [
  { value: 'tile', label: 'Tile view', icon: 'mdi:view-grid' },
  { value: 'list', label: 'List view', icon: 'mdi:view-list' }
]

const filteredCollections = computed(() => {
  const collections = collectionStore.collections || []
  return filterCollectionsByQuery(collections, debouncedSearchQuery.value, { includeId: true })
})

onMounted(async () => {
  // Load collections if not already loaded
  if (collectionStore.collections.length === 0) {
    await collectionStore.loadCollections()
  }
  
  // Load all escrows from blockchain via escrow store
  await escrowStore.loadAllEscrows()
  
  // Calculate open trades counts from loaded escrows (pass escrows directly)
  collectionStore.refreshOpenTradesCounts(escrowStore.escrows)
})
</script>
