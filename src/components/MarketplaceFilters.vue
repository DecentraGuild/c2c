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
import { getEscrowItemMetadata } from '../composables/useCollectionMetadata'
import { filterEscrowsByCollection, filterActiveEscrows } from '../utils/marketplaceHelpers'

const props = defineProps({
  collection: {
    type: Object,
    default: null
  },
  escrows: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:activeFilters'])

const activeFilters = ref(new Set()) // Set of "itemType:class" strings
const expandedItemTypes = ref(new Set())

// Build grouped filters from escrows
const groupedFilters = computed(() => {
  if (!props.collection || props.escrows.length === 0) {
    return {}
  }

  // Filter escrows by collection first
  const collectionEscrows = filterEscrowsByCollection(props.escrows, props.collection)
  const activeEscrows = filterActiveEscrows(collectionEscrows)
  
  const groups = {}
  
  activeEscrows.forEach(escrow => {
    const metadata = getEscrowItemMetadata(props.collection, escrow)
    if (!metadata) return
    
    const itemType = metadata.itemType || 'unknown'
    const classValue = metadata.class || 'unknown'
    
    if (!groups[itemType]) {
      groups[itemType] = {}
    }
    
    if (!groups[itemType][classValue]) {
      groups[itemType][classValue] = 0
    }
    
    groups[itemType][classValue]++
  })
  
  // Convert to array format for easier rendering
  const result = {}
  Object.keys(groups).forEach(itemType => {
    result[itemType] = Object.keys(groups[itemType]).map(classValue => ({
      class: classValue,
      count: groups[itemType][classValue]
    })).sort((a, b) => b.count - a.count)
  })
  
  return result
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

// Clear all filters
const clearFilters = () => {
  activeFilters.value.clear()
  emit('update:activeFilters', activeFilters.value)
}

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return activeFilters.value.size > 0
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
  activeFilters: computed(() => activeFilters.value)
})
</script>
