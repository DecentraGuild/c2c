<template>
  <router-link
    :to="`/escrow/${escrow.id}`"
    class="card hover:border-primary-color/50 transition-all duration-200 hover:shadow-lg block h-full w-full"
  >
    <!-- Card View (Vertical) -->
    <div v-if="viewMode === 'card'" class="p-3 sm:p-4 flex flex-col h-full">
      <!-- Trade Type Badge -->
      <div class="flex items-center justify-between mb-3">
        <span
          :class="[
            'px-2.5 py-1 rounded-lg text-xs font-bold',
            tradeTypeClass,
            tradeTypeBgClass
          ]"
        >
          {{ tradeTypeLabel }}
        </span>
        <span class="text-xs text-text-muted">
          {{ escrow.allowPartialFill ? 'Partial' : 'Full' }}
        </span>
      </div>

      <!-- Token Images -->
      <div class="relative w-full aspect-[2/1] mb-3 rounded-lg overflow-hidden bg-secondary-bg flex items-center justify-center">
        <div class="absolute inset-0 flex items-center justify-center gap-3 p-4">
          <!-- Deposit Token Image -->
          <div class="flex-1 flex flex-col items-center justify-center">
            <img
              v-if="depositTokenImage"
              :src="depositTokenImage"
              :alt="depositTokenDisplayName"
              class="w-full h-full max-w-20 max-h-20 object-contain"
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
              class="w-full h-full max-w-20 max-h-20 object-contain"
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
      <div class="space-y-2.5 flex-1">
        <!-- Deposit Token -->
        <div>
          <div class="text-sm font-semibold text-text-primary">
            {{ formatAmount(escrow.depositRemaining) }} {{ depositTokenDisplayName }}
          </div>
          <div class="text-xs text-text-secondary">Offering</div>
        </div>

        <!-- Request Token -->
        <div>
          <div class="text-sm font-semibold text-text-primary">
            {{ formatAmount(escrow.requestAmount) }} {{ requestTokenDisplayName }}
          </div>
          <div class="text-xs text-text-secondary">Requesting</div>
        </div>

        <!-- Price & Status -->
        <div class="pt-2.5 border-t border-border-color mt-auto">
          <div class="text-xs text-text-muted mb-1">Price</div>
          <div class="text-sm font-semibold text-text-primary">
            {{ formatPrice(escrow.price) }}
          </div>
        </div>
      </div>
    </div>

    <!-- List View (Horizontal) - Compact with vertical badge on mobile -->
    <div v-else class="flex items-stretch gap-2 sm:gap-3 p-2 sm:p-2.5">
      <!-- Trade Type Badge - Vertical on mobile, horizontal on desktop -->
      <div class="flex-shrink-0 flex items-center">
        <!-- Mobile: Vertical -->
        <div
          class="sm:hidden px-1 py-2 rounded text-[10px] font-bold whitespace-nowrap"
          :class="[tradeTypeClass, tradeTypeBgClass]"
          style="writing-mode: vertical-rl; text-orientation: mixed;"
        >
          {{ tradeTypeLabel }}
        </div>
        <!-- Desktop: Horizontal -->
        <span
          class="hidden sm:inline-block px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
          :class="[tradeTypeClass, tradeTypeBgClass]"
        >
          {{ tradeTypeLabel }}
        </span>
      </div>

      <!-- Token Info -->
      <div class="flex-1 min-w-0 flex items-center gap-2 sm:gap-4">
        <!-- Deposit Token -->
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <div class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
            <img
              v-if="depositTokenImage"
              :src="depositTokenImage"
              :alt="depositTokenDisplayName"
              class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
            />
            <Icon
              v-else
              icon="mdi:coin"
              class="w-10 h-10 sm:w-12 sm:h-12 text-text-muted"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-semibold text-text-primary text-sm leading-tight">
              {{ formatAmount(escrow.depositRemaining) }}
            </div>
            <div class="text-xs text-text-secondary truncate leading-tight mt-0.5" :title="depositTokenDisplayName">
              {{ depositTokenDisplayName }}
            </div>
          </div>
        </div>

        <!-- Arrow -->
        <div class="flex-shrink-0">
          <Icon icon="mdi:arrow-right" class="w-4 h-4 sm:w-5 sm:h-5 text-text-muted" />
        </div>

        <!-- Request Token -->
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <div class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
            <img
              v-if="requestTokenImage"
              :src="requestTokenImage"
              :alt="requestTokenDisplayName"
              class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
            />
            <Icon
              v-else
              icon="mdi:coin"
              class="w-10 h-10 sm:w-12 sm:h-12 text-text-muted"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-semibold text-text-primary text-sm leading-tight">
              {{ formatAmount(escrow.requestAmount) }}
            </div>
            <div class="text-xs text-text-secondary truncate leading-tight mt-0.5" :title="requestTokenDisplayName">
              {{ requestTokenDisplayName }}
            </div>
          </div>
        </div>
      </div>

      <!-- Price & Status -->
      <div class="flex-shrink-0 text-right flex flex-col justify-center min-w-[80px] sm:min-w-[100px]">
        <div class="text-sm font-semibold text-text-primary leading-tight">
          {{ formatPrice(escrow.price) }}
        </div>
        <div class="text-xs text-text-secondary leading-tight mt-1">
          {{ escrow.allowPartialFill ? 'Partial' : 'Full' }}
        </div>
        <!-- User Balance Indicator -->
        <div
          v-if="canFill"
          class="flex items-center justify-end gap-1 text-xs text-primary-color mt-1.5"
        >
          <Icon icon="mdi:check-circle" class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Can fill</span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { formatDecimals } from '../utils/formatters'
import { getTradeType, getShopCurrencyMints, canUserFillEscrow } from '../utils/marketplaceHelpers'
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

  // Use shop currency mints (baseCurrency + customCurrencies) for trade type; fallback to allowedCurrencies
  const shopCurrencyMints = getShopCurrencyMints(props.collection) || props.collection.allowedCurrencies || []
  return getTradeType(
    props.escrow,
    collectionMints,
    shopCurrencyMints
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
    case 'swap':
      return 'SWAP'
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
    case 'swap':
      return 'text-trade-swap'
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
    case 'swap':
      return 'bg-trade-swap/20'
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
