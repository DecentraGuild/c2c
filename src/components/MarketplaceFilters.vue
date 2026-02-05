<template>
  <div class="card p-4">
    <!-- Filters -->
    <div>
      <!-- ItemType Groups -->
      <div v-for="(classes, itemType) in groupedFilters" :key="itemType" class="mb-6 last:mb-0">
        <button
          @click="toggleItemType(itemType)"
          class="w-full flex items-center justify-between text-sm font-semibold text-text-primary mb-2 hover:text-primary-color transition-colors"
        >
          <span class="capitalize">{{ itemType || 'Unknown' }}</span>
          <Icon 
            :icon="expandedItemTypes.has(itemType) ? 'mdi:chevron-down' : 'mdi:chevron-right'" 
            class="w-4 h-4"
          />
        </button>
        
        <!-- Classes under ItemType -->
        <div v-if="expandedItemTypes.has(itemType)" class="ml-3 space-y-1">
          <button
            v-for="classItem in classes"
            :key="`${itemType}-${classItem.class}`"
            @click="toggleFilter(itemType, classItem.class)"
            :class="[
              'w-full text-left px-3 py-1.5 rounded text-sm transition-colors',
              isFilterActive(itemType, classItem.class)
                ? 'bg-primary-color text-white'
                : 'text-text-secondary hover:bg-secondary-bg'
            ]"
          >
            <span class="capitalize">{{ classItem.class || 'Unknown' }}</span>
            <span class="ml-2 text-xs opacity-75">({{ classItem.count }})</span>
          </button>
        </div>
      </div>

      <!-- Collection filter -->
      <div v-if="groupedCollections.length > 0" class="mb-6 last:mb-0">
        <button
          @click="toggleCollectionSection"
          class="w-full flex items-center justify-between text-sm font-semibold text-text-primary mb-2 hover:text-primary-color transition-colors"
        >
          <span>Collection</span>
          <Icon
            :icon="collectionSectionExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'"
            class="w-4 h-4"
          />
        </button>
        <div v-if="collectionSectionExpanded" class="ml-3 space-y-1">
          <button
            v-for="coll in groupedCollections"
            :key="coll.id"
            @click="toggleCollectionFilter(coll.id)"
            :class="[
              'w-full text-left px-3 py-1.5 rounded text-sm transition-colors',
              isCollectionFilterActive(coll.id)
                ? 'bg-primary-color text-white'
                : 'text-text-secondary hover:bg-secondary-bg'
            ]"
          >
            <span>{{ coll.label || coll.id }}</span>
            <span class="ml-2 text-xs opacity-75">({{ coll.count }})</span>
          </button>
        </div>
      </div>

      <!-- Clear Filters -->
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="w-full mt-4 px-4 py-2 text-sm text-text-secondary hover:text-primary-color transition-colors border border-border-color rounded-lg hover:border-primary-color"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { getMetadataForMint } from '@/utils/marketplaceFilterMetadata'
import { getCollectionCurrencies } from '@/utils/constants/baseCurrencies'
import { filterEscrowsByStorefront, filterActiveEscrows } from '@/utils/marketplaceHelpers'
import { useStorefrontMetadataStore } from '@/stores/storefrontMetadata'

const props = defineProps({
  storefront: {
    type: Object,
    default: null
  },
  escrows: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:activeFilters', 'update:activeCollectionFilters'])

const activeFilters = ref(new Set()) // Set of "itemType:class" strings
const activeCollectionFilters = ref(new Set()) // Set of collectionId (collection mint)
const expandedItemTypes = ref(new Set())
const collectionSectionExpanded = ref(true)
const toggleCollectionSection = () => {
  collectionSectionExpanded.value = !collectionSectionExpanded.value
}

const storefrontMetadataStore = useStorefrontMetadataStore()

const shopCurrencies = computed(() =>
  props.storefront ? getCollectionCurrencies(props.storefront) : []
)
const cachedNFTs = computed(() =>
  props.storefront ? storefrontMetadataStore.getCachedNFTs(props.storefront.id) || [] : []
)

const opts = computed(() => ({
  cachedNFTs: cachedNFTs.value,
  shopCurrencies: shopCurrencies.value
}))

// Build grouped filters from both deposit and request for each escrow
const groupedFilters = computed(() => {
  if (!props.storefront || props.escrows.length === 0) return {}

  const cachedMints = new Set(
    (cachedNFTs.value || [])
      .map(n => (n?.mint && String(n.mint).toLowerCase()) || null)
      .filter(Boolean)
  )
  const storefrontEscrows = filterEscrowsByStorefront(props.escrows, props.storefront, {
    cachedCollectionMints: cachedMints
  })
  const activeEscrows = filterActiveEscrows(storefrontEscrows)
  const groups = {}

  activeEscrows.forEach(escrow => {
    const depositMint = escrow.depositToken?.mint
    const requestMint = escrow.requestToken?.mint
    const keysInEscrow = new Set()

    for (const mint of [depositMint, requestMint]) {
      if (!mint) continue
      const meta = getMetadataForMint(props.storefront, mint, opts.value)
      if (!meta) continue
      const itemType = meta.itemType || 'unknown'
      const classValue = meta.class || 'unknown'
      const key = `${itemType}:${classValue}`
      if (keysInEscrow.has(key)) continue
      keysInEscrow.add(key)
      if (!groups[itemType]) groups[itemType] = {}
      groups[itemType][classValue] = (groups[itemType][classValue] || 0) + 1
    }
  })

  const result = {}
  Object.keys(groups).forEach(itemType => {
    result[itemType] = Object.keys(groups[itemType])
      .map(classValue => ({ class: classValue, count: groups[itemType][classValue] }))
      .sort((a, b) => b.count - a.count)
  })
  return result
})

// Build collection filter options from both sides (collectionId = collection mint)
const groupedCollections = computed(() => {
  if (!props.storefront || props.escrows.length === 0) return []

  const cachedMints = new Set(
    (cachedNFTs.value || [])
      .map(n => (n?.mint && String(n.mint).toLowerCase()) || null)
      .filter(Boolean)
  )
  const storefrontEscrows = filterEscrowsByStorefront(props.escrows, props.storefront, {
    cachedCollectionMints: cachedMints
  })
  const activeEscrows = filterActiveEscrows(storefrontEscrows)
  const map = {} // id -> { id, label, count }

  activeEscrows.forEach(escrow => {
    const idsInEscrow = new Set()
    for (const mint of [escrow.depositToken?.mint, escrow.requestToken?.mint]) {
      if (!mint) continue
      const meta = getMetadataForMint(props.storefront, mint, opts.value)
      if (!meta?.collectionId) continue
      if (idsInEscrow.has(meta.collectionId)) continue
      idsInEscrow.add(meta.collectionId)
      if (!map[meta.collectionId]) {
        map[meta.collectionId] = {
          id: meta.collectionId,
          label: meta.name || meta.collectionId,
          count: 0
        }
      }
      map[meta.collectionId].count++
    }
  })

  return Object.values(map).sort((a, b) => b.count - a.count)
})

// Check if filter is active
const isFilterActive = (itemType, classValue) => {
  const filterKey = `${itemType}:${classValue}`
  return activeFilters.value.has(filterKey)
}

// Toggle filter
const toggleFilter = (itemType, classValue) => {
  const filterKey = `${itemType}:${classValue}`
  if (activeFilters.value.has(filterKey)) {
    activeFilters.value.delete(filterKey)
  } else {
    activeFilters.value.add(filterKey)
  }
  emit('update:activeFilters', activeFilters.value)
}

// Toggle ItemType expansion
const toggleItemType = (itemType) => {
  if (expandedItemTypes.value.has(itemType)) {
    expandedItemTypes.value.delete(itemType)
  } else {
    expandedItemTypes.value.add(itemType)
  }
}

// Collection filter
const isCollectionFilterActive = (collectionId) => activeCollectionFilters.value.has(collectionId)

const toggleCollectionFilter = (collectionId) => {
  if (activeCollectionFilters.value.has(collectionId)) {
    activeCollectionFilters.value.delete(collectionId)
  } else {
    activeCollectionFilters.value.add(collectionId)
  }
  emit('update:activeCollectionFilters', activeCollectionFilters.value)
}

// Clear all filters
const clearFilters = () => {
  activeFilters.value.clear()
  activeCollectionFilters.value.clear()
  emit('update:activeFilters', activeFilters.value)
  emit('update:activeCollectionFilters', activeCollectionFilters.value)
}

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return activeFilters.value.size > 0 || activeCollectionFilters.value.size > 0
})

// Expand all item types when grouped filters change
watch(() => groupedFilters.value, (newFilters) => {
  if (newFilters && Object.keys(newFilters).length > 0 && expandedItemTypes.value.size === 0) {
    // Expand all item types by default
    Object.keys(newFilters).forEach(itemType => {
      expandedItemTypes.value.add(itemType)
    })
  }
}, { immediate: true })

// Expose methods for parent component
defineExpose({
  clearFilters,
  activeFilters: computed(() => activeFilters.value),
  activeCollectionFilters: computed(() => activeCollectionFilters.value)
})
</script>
