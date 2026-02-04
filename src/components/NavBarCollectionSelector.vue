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
            v-if="selectedStorefront?.logo"
            :src="selectedStorefront.logo"
            :alt="selectedStorefront.name"
            class="w-5 h-5 object-contain rounded flex-shrink-0"
          />
          <Icon
            v-else-if="selectedStorefront"
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
          {{ selectedStorefront?.name || 'Select Storefront' }}
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
      class="absolute z-50 mt-2 w-80 bg-window-bg border border-window-border rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col"
    >
      <!-- Search Input -->
      <div class="p-3 border-b border-window-border">
        <div class="relative">
          <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search collections..."
            class="w-full pl-9 pr-3 py-2 bg-primary-bg border border-window-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-color focus:border-transparent"
            @focus.stop
          />
        </div>
      </div>

      <!-- Collections List -->
      <BaseScrollArea max-height="16rem" content-class="flex-1 min-h-0">
        <!-- Clear Selection Option (shown when collection is selected) -->
        <div
          v-if="modelValue"
          @click="clearSelection"
          class="px-4 py-3 hover:bg-primary-color/10 cursor-pointer transition-colors flex items-center gap-3 border-b border-window-border"
        >
          <Icon icon="mdi:arrow-left" class="w-5 h-5 text-text-muted flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-text-primary">Back to Platform</div>
            <div class="text-xs text-text-secondary">Clear collection selection</div>
          </div>
        </div>

        <div
          v-for="storefront in filteredStorefronts"
          :key="storefront.id"
          @click="selectStorefront(storefront)"
          class="px-2 py-2 hover:bg-primary-color/10 cursor-pointer transition-colors flex items-center gap-2 min-h-0 max-h-12"
        >
          <!-- Vertical Official/Community label on left (2-line height, no stretch) -->
          <div
            class="flex-shrink-0 h-10 max-h-10 flex items-center justify-center overflow-hidden"
            aria-hidden="true"
          >
            <div
              class="px-0.5 py-0.5 rounded text-[7px] font-bold whitespace-nowrap"
              :class="getBadgeClasses(storefront)"
              style="writing-mode: vertical-rl; text-orientation: mixed;"
            >
              {{ getBadgeLabel(storefront) }}
            </div>
          </div>
          <img
            v-if="storefront.logo"
            :src="storefront.logo"
            :alt="storefront.name"
            class="w-8 h-8 object-contain rounded flex-shrink-0"
          />
          <Icon
            v-else
            icon="mdi:image-off"
            class="w-8 h-8 text-text-muted flex-shrink-0"
          />
          <div class="flex-1 min-w-0 min-h-0 flex flex-col justify-center py-0.5">
            <div class="font-semibold text-text-primary truncate text-sm leading-tight">{{ storefront.name }}</div>
            <div v-if="storefront.description" class="text-xs text-text-secondary truncate leading-tight mt-0.5">
              {{ storefront.description }}
            </div>
          </div>
          <Icon
            v-if="modelValue === storefront.id"
            icon="mdi:check"
            class="w-5 h-5 text-primary-color flex-shrink-0"
          />
        </div>
        
        <div v-if="filteredStorefronts.length === 0" class="px-4 py-6 text-center text-sm text-text-muted">
          No storefronts found
        </div>
      </BaseScrollArea>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useStorefrontStore } from '@/stores/storefront'
import { filterStorefrontsByQuery } from '@/utils/collectionHelpers'
import BaseScrollArea from './BaseScrollArea.vue'

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

const storefrontStore = useStorefrontStore()
const searchQuery = ref('')
const showDropdown = ref(false)
const dropdownRef = ref(null)
const containerRef = ref(null)

const storefronts = computed(() => storefrontStore.storefronts || [])

const selectedStorefront = computed(() => {
  if (!props.modelValue) return null
  return storefronts.value.find(s => s.id === props.modelValue)
})

const filteredStorefronts = computed(() =>
  filterStorefrontsByQuery(storefronts.value, searchQuery.value)
)

const getVerificationStatus = (storefront) => {
  return storefront.verification_status || (storefront.verified ? 'verified' : 'community')
}

const getBadgeLabel = (storefront) => {
  return getVerificationStatus(storefront) === 'verified' ? 'Official' : 'Community'
}

const getBadgeClasses = (storefront) => {
  const status = getVerificationStatus(storefront)
  if (status === 'verified') {
    return 'bg-status-warning/20 text-status-warning border border-status-warning/50'
  }
  return 'bg-status-info/20 text-status-info border border-status-info/50'
}

const selectStorefront = (storefront) => {
  emit('update:modelValue', storefront.id)
  storefrontStore.setSelectedStorefront(storefront.id)
  showDropdown.value = false
  searchQuery.value = ''
}

const clearSelection = () => {
  emit('update:modelValue', null)
  storefrontStore.clearSelectedStorefront()
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
