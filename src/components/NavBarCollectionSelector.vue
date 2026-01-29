<template>
  <div class="relative" ref="containerRef">
    <!-- Compact Button (for navbar) -->
    <div class="flex items-center gap-2">
      <button
        @click.stop="showDropdown = !showDropdown"
        class="flex items-center gap-2 px-3 py-2 bg-secondary-bg border border-border-color rounded-lg hover:border-primary-color/50 transition-colors min-w-[140px] max-w-[200px]"
      >
        <template v-if="!hideLogo">
          <img
            v-if="selectedCollection?.logo"
            :src="selectedCollection.logo"
            :alt="selectedCollection.name"
            class="w-5 h-5 object-contain rounded flex-shrink-0"
          />
          <Icon
            v-else-if="selectedCollection"
            icon="mdi:image-off"
            class="w-5 h-5 text-text-muted flex-shrink-0"
          />
          <Icon
            v-else
            icon="mdi:store-outline"
            class="w-5 h-5 text-text-muted flex-shrink-0"
          />
        </template>
        <span class="text-sm font-semibold text-text-primary truncate flex-1 text-left">
          {{ selectedCollection?.name || 'Select Collection' }}
        </span>
        <Icon icon="mdi:chevron-down" class="w-4 h-4 text-text-muted flex-shrink-0" />
      </button>
      
      <!-- Clear Button (shown when collection is selected) -->
      <button
        v-if="modelValue"
        @click.stop="clearSelection"
        class="p-2 text-text-secondary hover:text-primary-color hover:bg-primary-color/10 rounded-lg transition-colors"
        aria-label="Clear collection selection"
        title="Back to Platform"
      >
        <Icon icon="mdi:close" class="w-5 h-5" />
      </button>
    </div>

    <!-- Dropdown -->
    <div
      v-if="showDropdown"
      ref="dropdownRef"
      class="absolute z-50 mt-2 w-80 bg-secondary-bg border border-border-color rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col"
    >
      <!-- Search Input -->
      <div class="p-3 border-b border-border-color">
        <div class="relative">
          <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search collections..."
            class="w-full pl-9 pr-3 py-2 bg-primary-bg border border-border-color rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-color focus:border-transparent"
            @focus.stop
          />
        </div>
      </div>

      <!-- Collections List -->
      <div class="overflow-y-auto max-h-64">
        <!-- Clear Selection Option (shown when collection is selected) -->
        <div
          v-if="modelValue"
          @click="clearSelection"
          class="px-4 py-3 hover:bg-primary-color/10 cursor-pointer transition-colors flex items-center gap-3 border-b border-border-color"
        >
          <Icon icon="mdi:arrow-left" class="w-5 h-5 text-text-muted flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-text-primary">Back to Platform</div>
            <div class="text-xs text-text-secondary">Clear collection selection</div>
          </div>
        </div>

        <div
          v-for="collection in filteredCollections"
          :key="collection.id"
          @click="selectCollection(collection)"
          class="px-4 py-3 hover:bg-primary-color/10 cursor-pointer transition-colors flex items-center gap-3"
        >
          <img
            v-if="collection.logo"
            :src="collection.logo"
            :alt="collection.name"
            class="w-8 h-8 object-contain rounded flex-shrink-0"
          />
          <Icon
            v-else
            icon="mdi:image-off"
            class="w-8 h-8 text-text-muted flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <div class="font-semibold text-text-primary truncate">{{ collection.name }}</div>
              <CollectionBadge
                :verification-status="collection.verification_status || (collection.verified ? 'verified' : 'community')"
              />
            </div>
            <div v-if="collection.description" class="text-xs text-text-secondary truncate">
              {{ collection.description }}
            </div>
          </div>
          <Icon
            v-if="modelValue === collection.id"
            icon="mdi:check"
            class="w-5 h-5 text-primary-color flex-shrink-0"
          />
        </div>
        
        <div v-if="filteredCollections.length === 0" class="px-4 py-6 text-center text-sm text-text-muted">
          No collections found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useCollectionStore } from '../stores/collection'
import CollectionBadge from './CollectionBadge.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  hideLogo: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const collectionStore = useCollectionStore()
const searchQuery = ref('')
const showDropdown = ref(false)
const dropdownRef = ref(null)
const containerRef = ref(null)

const collections = computed(() => collectionStore.collections || [])

const selectedCollection = computed(() => {
  if (!props.modelValue) return null
  return collections.value.find(c => c.id === props.modelValue)
})

const filteredCollections = computed(() => {
  if (!searchQuery.value.trim()) {
    return collections.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return collections.value.filter(collection => {
    return (
      collection.name.toLowerCase().includes(query) ||
      (collection.description && collection.description.toLowerCase().includes(query))
    )
  })
})

const selectCollection = (collection) => {
  emit('update:modelValue', collection.id)
  collectionStore.setSelectedCollection(collection.id)
  showDropdown.value = false
  searchQuery.value = ''
}

const clearSelection = () => {
  emit('update:modelValue', null)
  collectionStore.clearSelectedCollection()
  showDropdown.value = false
  searchQuery.value = ''
}

// Handle click outside
const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(() => props.modelValue, () => {
  searchQuery.value = ''
})
</script>
