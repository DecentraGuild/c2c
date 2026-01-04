<template>
  <BaseDropdown 
    :show="show" 
    container-class="bg-[#252540] border border-border-color rounded-xl shadow-xl max-h-96 overflow-hidden flex flex-col"
    @close="$emit('close')"
  >
      <!-- Custom Token Input (on top) -->
      <div class="px-3 py-2 border-b border-border-color bg-secondary-bg/30">
        <div class="flex items-center gap-2">
          <input
            v-model="customTokenInput"
            type="text"
            placeholder="Enter custom token ID..."
            class="input-field flex-1 text-sm"
            @keyup.enter="handleCustomTokenSubmit"
          />
          <button
            @click="handleCustomTokenSubmit"
            :disabled="fetchingTokenInfo || !customTokenInput.trim()"
            class="px-3 py-1.5 text-xs font-medium rounded bg-secondary-bg hover:bg-secondary-bg/80 text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon v-if="fetchingTokenInfo" icon="svg-spinners:ring-resize" class="w-4 h-4" />
            <span v-else>Add</span>
          </button>
        </div>
        <div v-if="error" class="mt-1.5 text-xs text-red-400">
          {{ error }}
        </div>
      </div>

      <!-- Search Input (second) -->
      <div class="p-3 border-b border-border-color">
        <div class="relative">
          <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by ticker, name, or token ID..."
            class="input-field w-full pl-9 pr-3"
            @input="handleSearch"
            @focus="handleSearch"
          />
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto">
        <!-- Loading State -->
        <div v-if="loading" class="p-4 text-center text-text-muted">
          <Icon icon="svg-spinners:ring-resize" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">Searching tokens...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error && !searchQuery && !customTokenInput" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:alert-circle-outline" class="w-8 h-8 inline-block mb-2 text-red-400" />
          <p class="text-sm text-red-400">{{ error }}</p>
        </div>

        <!-- Empty Search -->
        <div v-else-if="!searchQuery && searchResults.length === 0 && !loading" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:magnify" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">Search for tokens by ticker, name, or token ID</p>
        </div>

        <!-- No Results -->
        <div v-else-if="searchQuery && searchResults.length === 0 && !loading" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:information-outline" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">No tokens found</p>
          <p class="text-xs mt-1">Try entering a custom token ID at the top</p>
        </div>

        <!-- Search Results -->
        <div v-else-if="searchResults.length > 0" class="divide-y divide-border-color">
          <button
            v-for="token in searchResults"
            :key="token.mint"
            @click="selectToken(token)"
            class="w-full px-4 py-3 hover:bg-secondary-bg/50 transition-colors flex items-center justify-between text-left"
          >
            <TokenDisplay :token="token" :show-address="true" />
            <div v-if="token.decimals !== null && token.decimals !== undefined" class="text-right flex-shrink-0 ml-2">
              <div class="text-xs text-text-muted">
                {{ token.decimals }} decimals
              </div>
            </div>
          </button>
        </div>
      </div>
  </BaseDropdown>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useTokenRegistry } from '../composables/useTokenRegistry'
import { debounce } from '../utils/formatters'
import BaseDropdown from './BaseDropdown.vue'
import TokenDisplay from './TokenDisplay.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'close'])

const tokenRegistry = useTokenRegistry()
const { 
  loading, 
  error, 
  searchQuery, 
  searchResults, 
  customTokenInput, 
  fetchingTokenInfo,
  searchTokens, 
  handleCustomToken,
  preloadRegistry,
  fetchTokenInfo
} = tokenRegistry

// Debounced search function
const debouncedSearch = debounce((query) => {
  if (query && query.trim()) {
    searchTokens(query)
  }
}, 300)

const handleSearch = () => {
  debouncedSearch(searchQuery.value)
}

const handleCustomTokenSubmit = async () => {
  if (!customTokenInput.value.trim()) return
  
  const tokenInfo = await handleCustomToken(customTokenInput.value)
  if (tokenInfo) {
    selectToken(tokenInfo)
  }
}

const selectToken = async (token) => {
  // If token doesn't have decimals, fetch complete info
  let tokenToSelect = token
  
  if (token.decimals === null || token.decimals === undefined) {
    // Fetch complete token info including decimals
    const completeInfo = await fetchTokenInfo(token.mint)
    if (completeInfo) {
      tokenToSelect = completeInfo
    }
  }
  
  emit('select', tokenToSelect)
  emit('close')
}

// Preload registry on mount
watch(() => props.show, (isShowing) => {
  if (isShowing) {
    preloadRegistry()
  }
}, { immediate: true })

// Watch for show prop to reset state
watch(() => props.show, (isShowing) => {
  if (isShowing) {
    searchQuery.value = ''
    customTokenInput.value = ''
  }
})
</script>
