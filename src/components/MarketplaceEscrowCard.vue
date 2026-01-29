<template>
  <router-link
    :to="`/escrow/${escrow.id}`"
    class="card hover:border-primary-color/50 transition-all duration-200 hover:shadow-lg block h-full"
  >
    <!-- Card View (Vertical) -->
    <div v-if="viewMode === 'card'" class="flex flex-col h-full">
      <!-- Trade Type Badge -->
      <div class="mb-3">
        <span
          :class="[
            'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
            tradeTypeClass,
            tradeTypeBgClass
          ]"
        >
          {{ tradeTypeLabel }}
        </span>
      </div>

      <!-- Token Images -->
      <div class="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-secondary-bg flex items-center justify-center">
        <div class="absolute inset-0 flex items-center justify-center gap-4 p-4">
          <!-- Deposit Token Image -->
          <div class="flex-1 flex flex-col items-center justify-center">
            <img
              v-if="depositTokenImage"
              :src="depositTokenImage"
              :alt="depositTokenDisplayName"
              class="w-full h-full max-w-24 max-h-24 object-contain"
            />
            <Icon
              v-else
              icon="mdi:coin"
              class="w-16 h-16 text-text-muted"
            />
          </div>
          
          <!-- Arrow -->
          <Icon icon="mdi:arrow-right" class="w-6 h-6 text-text-muted flex-shrink-0" />
          
          <!-- Request Token Image -->
          <div class="flex-1 flex flex-col items-center justify-center">
            <img
              v-if="requestTokenImage"
              :src="requestTokenImage"
              :alt="requestTokenDisplayName"
              class="w-full h-full max-w-24 max-h-24 object-contain"
            />
            <Icon
              v-else
              icon="mdi:coin"
              class="w-16 h-16 text-text-muted"
            />
          </div>
        </div>
      </div>

      <!-- Token Info -->
      <div class="flex-1 flex flex-col">
        <!-- Deposit Token -->
        <div class="mb-3">
          <div class="text-base font-semibold text-text-primary mb-1">
            {{ formatAmount(escrow.depositRemaining) }}
          </div>
          <div class="text-sm text-text-secondary line-clamp-2" :title="depositTokenDisplayName">
            {{ depositTokenDisplayName }}
          </div>
        </div>

        <!-- Request Token -->
        <div class="mb-4">
          <div class="text-base font-semibold text-text-primary mb-1">
            {{ formatAmount(escrow.requestAmount) }}
          </div>
          <div class="text-sm text-text-secondary line-clamp-2" :title="requestTokenDisplayName">
            {{ requestTokenDisplayName }}
          </div>
        </div>

        <!-- Price & Status -->
        <div class="pt-4 border-t border-border-color mt-auto">
          <div class="text-sm font-semibold text-text-primary mb-1">
            {{ formatPrice(escrow.price) }}
          </div>
          <div class="text-xs text-text-secondary mb-2">
            {{ escrow.allowPartialFill ? 'Partial Fill' : 'Full Fill' }}
          </div>
          <!-- User Balance Indicator -->
          <div
            v-if="canFill"
            class="flex items-center gap-1 text-xs text-primary-color"
          >
            <Icon icon="mdi:check-circle" class="w-4 h-4" />
            <span>You can fill</span>
          </div>
        </div>
      </div>
    </div>

    <!-- List View (Horizontal) -->
    <div v-else class="flex items-center gap-4 py-2">
      <!-- Trade Type Badge - Fixed Width -->
      <div class="flex-shrink-0 self-center w-16 flex items-center justify-center">
        <span
          :class="[
            'px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap',
            tradeTypeClass,
            tradeTypeBgClass
          ]"
        >
          {{ tradeTypeLabel }}
        </span>
      </div>

      <!-- Token Info -->
      <div class="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <!-- Deposit Token -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="flex-shrink-0 w-12 h-12 flex items-center justify-center">
            <img
              v-if="depositTokenImage"
              :src="depositTokenImage"
              :alt="depositTokenDisplayName"
              class="w-12 h-12 rounded-lg object-cover"
            />
            <Icon
              v-else
              icon="mdi:coin"
              class="w-12 h-12 text-text-muted"
            />
          </div>
          <div class="min-w-0 flex-1 flex flex-col justify-center">
            <div class="font-semibold text-text-primary text-base leading-tight">
              {{ formatAmount(escrow.depositRemaining) }}
            </div>
            <div class="text-sm text-text-secondary truncate leading-tight mt-0.5" :title="depositTokenDisplayName">
              {{ depositTokenDisplayName }}
            </div>
          </div>
        </div>

        <!-- Arrow -->
        <div class="flex-shrink-0 flex items-center justify-center">
          <Icon icon="mdi:arrow-right" class="w-5 h-5 text-text-muted" />
        </div>

        <!-- Request Token -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="flex-shrink-0 w-12 h-12 flex items-center justify-center">
            <img
              v-if="requestTokenImage"
              :src="requestTokenImage"
              :alt="requestTokenDisplayName"
              class="w-12 h-12 rounded-lg object-cover"
            />
            <Icon
              v-else
              icon="mdi:coin"
              class="w-12 h-12 text-text-muted"
            />
          </div>
          <div class="min-w-0 flex-1 flex flex-col justify-center">
            <div class="font-semibold text-text-primary text-base leading-tight">
              {{ formatAmount(escrow.requestAmount) }}
            </div>
            <div class="text-sm text-text-secondary truncate leading-tight mt-0.5" :title="requestTokenDisplayName">
              {{ requestTokenDisplayName }}
            </div>
          </div>
        </div>
      </div>

      <!-- Price & Status - Fixed Width -->
      <div class="flex-shrink-0 text-right self-center w-24">
        <div class="text-base font-semibold text-text-primary leading-tight">
          {{ formatPrice(escrow.price) }}
        </div>
        <div class="text-sm text-text-secondary leading-tight mt-1">
          {{ escrow.allowPartialFill ? 'Partial Fill' : 'Full Fill' }}
        </div>
        <!-- User Balance Indicator -->
        <div
          v-if="canFill"
          class="flex items-center justify-end gap-1 text-xs text-primary-color mt-1.5"
        >
          <Icon icon="mdi:check-circle" class="w-4 h-4" />
          <span>You can fill</span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { formatDecimals } from '../utils/formatters'
import { getTradeType, canUserFillEscrow } from '../utils/marketplaceHelpers'
import { useCollectionMetadata } from '../composables/useCollectionMetadata'

const props = defineProps({
  escrow: {
    type: Object,
    required: true
  },
  collection: {
    type: Object,
    default: null
  },
  userBalances: {
    type: Object,
    default: () => ({})
  },
  viewMode: {
    type: String,
    default: 'list' // 'list' or 'card'
  }
})

// Use collection metadata composable
const collectionMetadata = useCollectionMetadata(computed(() => props.collection))

// Get display name for token (prefer collection item name, fallback to token name/symbol)
const getTokenDisplayName = (token) => {
  return collectionMetadata.getTokenDisplayName(token)
}

// Get token image (prefer collection item image, fallback to token image)
const getTokenImage = (token) => {
  return collectionMetadata.getTokenImage(token)
}

// Computed properties for display
const depositTokenDisplayName = computed(() => {
  return getTokenDisplayName(props.escrow.depositToken)
})

const requestTokenDisplayName = computed(() => {
  return getTokenDisplayName(props.escrow.requestToken)
})

const depositTokenImage = computed(() => {
  return getTokenImage(props.escrow.depositToken)
})

const requestTokenImage = computed(() => {
  return getTokenImage(props.escrow.requestToken)
})

const tradeType = computed(() => {
  if (!props.collection) return null
  
  // Extract mint addresses from collectionMints (handle both old and new format)
  let collectionMints = props.collection.collectionMints || []
  if (Array.isArray(collectionMints) && collectionMints.length > 0) {
    if (typeof collectionMints[0] === 'object' && collectionMints[0].mint) {
      // New format: array of objects with mint property
      collectionMints = collectionMints.map(item => item.mint)
    }
  }
  
  return getTradeType(
    props.escrow,
    collectionMints,
    props.collection.allowedCurrencies || []
  )
})

const tradeTypeLabel = computed(() => {
  switch (tradeType.value) {
    case 'buy':
      return 'BUY'
    case 'sell':
      return 'SELL'
    case 'trade':
      return 'TRADE'
    default:
      return 'ORDER'
  }
})

const tradeTypeClass = computed(() => {
  switch (tradeType.value) {
    case 'buy':
      return 'text-trade-buy'
    case 'sell':
      return 'text-trade-sell'
    case 'trade':
      return 'text-trade-trade'
    default:
      return 'text-text-muted'
  }
})

const tradeTypeBgClass = computed(() => {
  switch (tradeType.value) {
    case 'buy':
      return 'bg-trade-buy/20'
    case 'sell':
      return 'bg-trade-sell/20'
    case 'trade':
      return 'bg-trade-trade/20'
    default:
      return 'bg-text-muted/20'
  }
})

const canFill = computed(() => {
  return canUserFillEscrow(props.escrow, props.userBalances)
})

const formatAmount = (amount) => {
  if (amount === 0) return '0'
  if (amount < 0.01) return '< 0.01'
  return formatDecimals(amount)
}

const formatPrice = (price) => {
  if (!price || price === 0) return 'N/A'
  // Price is requestAmount / depositAmount
  // For display, show as "1 X = Y Z"
  return `1:${formatDecimals(price)}`
}
</script>
