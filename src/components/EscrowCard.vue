<template>
  <div class="bg-secondary-bg/50 rounded-xl p-3 border border-border-color hover:border-primary-color/40 transition-all">
    <!-- Header Row -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 sm:gap-0 sm:justify-between mb-3">
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span
            :class="[
              'px-2 py-0.5 rounded text-xs font-semibold',
              escrow.status === 'active' ? 'bg-status-success/20 text-status-success' :
              escrow.status === 'filled' ? 'bg-primary-color/20 text-primary-color' :
              escrow.status === 'expired' ? 'bg-status-warning/20 text-status-warning' :
              'bg-status-error/20 text-status-error'
            ]"
          >
            {{ escrow.status.toUpperCase() }}
          </span>
          <span v-if="escrow.allowPartialFill" class="px-2 py-0.5 rounded text-xs bg-accent-color/20 text-accent-color">
            Partial Fill
          </span>
          <span v-if="escrow.onlyWhitelist" class="px-2 py-0.5 rounded text-xs bg-status-warning/20 text-status-warning">
            Whitelist Only
          </span>
        </div>
        
        <!-- Trade Details -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="text-text-muted text-xs">Offering:</span>
            <TokenAmountDisplay
              :token="escrow.depositToken"
              :amount="escrow.depositRemaining"
              :decimals="escrow.depositToken.decimals"
              icon-size="sm"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-text-muted text-xs">Requesting:</span>
            <TokenAmountDisplay
              :token="escrow.requestToken"
              :amount="escrow.requestAmount"
              :decimals="escrow.requestToken.decimals"
              icon-size="sm"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-text-muted text-xs">Price:</span>
            <span class="text-text-secondary text-xs">{{ formatPriceAsTrade(escrow) }}</span>
          </div>
          <div v-if="escrow.expireTimestamp > 0" class="flex items-center gap-1.5">
            <Icon icon="mdi:clock-outline" class="w-3.5 h-3.5 text-text-muted" />
            <span class="text-text-muted text-xs">
              Expires: {{ formatTimestamp(escrow.expireTimestamp * 1000) }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:ml-3">
        <div class="flex gap-1.5">
          <button
            @click="$emit('share', escrow)"
            class="btn-secondary text-xs py-2 px-2.5 inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-initial min-h-[40px]"
            title="Share escrow"
          >
            <Icon icon="mdi:share-variant" class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Share</span>
          </button>
          <router-link
            :to="`/escrow/${escrow.id}`"
            class="btn-secondary text-xs py-2 px-2.5 inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-initial min-h-[40px]"
            title="View details"
          >
            <Icon icon="mdi:eye" class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Details</span>
          </router-link>
        </div>
        <button
          v-if="escrow.status === 'filled'"
          @click="$emit('claim', escrow)"
          :disabled="loading"
          class="btn-primary text-xs py-2 px-2.5 inline-flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[40px] w-full sm:w-auto"
          title="Complete escrow and recover rent"
        >
          <Icon v-if="loading" icon="svg-spinners:ring-resize" class="w-4 h-4" />
          <Icon v-else icon="mdi:check-circle" class="w-4 h-4" />
          Complete
        </button>
        <button
          v-else-if="escrow.status === 'active' || escrow.status === 'expired'"
          @click="$emit('cancel', escrow)"
          :disabled="loading"
          class="btn-secondary text-sm py-2.5 sm:py-2 px-3 sm:px-4 inline-flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
          :title="escrow.status === 'expired' ? 'Claim back deposit from expired escrow' : 'Cancel escrow'"
        >
          <Icon v-if="loading" icon="svg-spinners:ring-resize" class="w-4 h-4" />
          <Icon v-else icon="mdi:close-circle" class="w-4 h-4" />
          <span>{{ escrow.status === 'expired' ? 'Claim' : 'Cancel' }}</span>
        </button>
      </div>
    </div>

    <!-- Escrow Details Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-border-color/50">
      <div class="flex items-center gap-2">
        <span class="text-text-muted">Escrow ID:</span>
        <BaseAddressDisplay 
          :address="escrow.id" 
          text-class="text-text-secondary text-xs"
          :start-chars="4"
          :end-chars="4"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-text-muted">Recipient:</span>
        <span v-if="!escrow.recipient" class="text-text-secondary">Any</span>
        <BaseAddressDisplay 
          v-else
          :address="escrow.recipient" 
          text-class="text-text-secondary text-xs"
          :start-chars="4"
          :end-chars="4"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import TokenAmountDisplay from './TokenAmountDisplay.vue'
import BaseAddressDisplay from './BaseAddressDisplay.vue'
import { formatTimestamp, formatDecimals } from '../utils/formatters'

defineProps({
  escrow: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['share', 'cancel', 'claim'])

// Same price-as-trade display as marketplace (deposit : request using human amounts)
const formatAmount = (amount) => {
  if (amount === 0) return '0'
  if (amount < 0.01) return '< 0.01'
  return formatDecimals(amount)
}
const formatPriceAsTrade = (escrow) => {
  if (!escrow?.depositRemaining && !escrow?.requestAmount) return 'N/A'
  const deposit = formatAmount(escrow.depositRemaining ?? 0)
  const request = formatAmount(escrow.requestAmount ?? 0)
  return `${deposit} : ${request}`
}
</script>
