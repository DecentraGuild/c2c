<template>
  <div class="card space-y-4">
    <button
      @click="$emit('toggle')"
      class="flex items-center justify-between w-full text-left"
    >
      <h2 class="text-lg font-bold text-text-primary">Escrow Details</h2>
      <Icon 
        :icon="show ? 'mdi:chevron-up' : 'mdi:chevron-down'" 
        class="w-6 h-6 text-text-muted transition-transform"
      />
    </button>
    
    <div v-show="show" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="text-sm text-text-muted mb-1 block">Escrow</label>
        <BaseAddressDisplay :address="escrow.id" />
      </div>
      <div>
        <label class="text-sm text-text-muted mb-1 block">Maker</label>
        <BaseAddressDisplay :address="escrow.maker" />
      </div>
      <div>
        <label class="text-sm text-text-muted mb-1 block">Deposited</label>
        <BaseAddressDisplay :address="escrow.depositToken.mint" />
      </div>
      <div>
        <label class="text-sm text-text-muted mb-1 block">Request</label>
        <BaseAddressDisplay :address="escrow.requestToken.mint" />
      </div>
      <div>
        <label class="text-sm text-text-muted">Deposit amount</label>
        <div class="text-text-primary text-sm">
          <TokenAmountDisplay
            :token="escrow.depositToken"
            :amount="escrow.depositAmount"
            :decimals="escrow.depositToken.decimals"
            icon-size="sm"
            amount-class="text-text-primary text-sm"
            ticker-class="text-text-primary text-sm"
          />
        </div>
      </div>
      <div>
        <label class="text-sm text-text-muted">Remaining amount</label>
        <div class="text-text-primary text-sm space-y-1">
          <TokenAmountDisplay
            :token="escrow.depositToken"
            :amount="escrow.depositRemaining"
            :decimals="escrow.depositToken.decimals"
            icon-size="sm"
            amount-class="text-text-primary text-sm"
            ticker-class="text-text-primary text-sm"
          />
          <TokenAmountDisplay
            :token="escrow.requestToken"
            :amount="escrow.depositRemaining * escrow.price"
            :decimals="escrow.requestToken.decimals"
            icon-size="sm"
            amount-class="text-text-primary text-sm"
            ticker-class="text-text-primary text-sm"
          />
          <span class="text-text-primary text-sm">{{ remainingPercentage }}%</span>
        </div>
      </div>
      <div>
        <label class="text-sm text-text-muted">Price</label>
        <div class="text-text-primary text-sm">
          <TokenAmountDisplay
            :token="escrow.requestToken"
            :amount="escrow.price"
            :decimals="escrow.requestToken.decimals"
            icon-size="sm"
            amount-class="text-text-primary text-sm"
            ticker-class="text-text-primary text-sm"
          />
        </div>
      </div>
      <div>
        <label class="text-sm text-text-muted mb-1 block">Recipient</label>
        <p v-if="isPublicEscrow" class="text-text-primary text-sm">Any wallet</p>
        <BaseAddressDisplay v-else :address="escrow.recipient" />
      </div>
    </div>

    <!-- Flags -->
    <div v-show="show" class="flex flex-wrap gap-2 pt-4 border-t border-border-color">
      <span
        :class="[
          'px-3 py-1 rounded-lg text-xs font-semibold',
          escrow.allowPartialFill ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'
        ]"
      >
        Partial fill: {{ escrow.allowPartialFill ? 'yes' : 'no' }}
      </span>
      <span
        :class="[
          'px-3 py-1 rounded-lg text-xs font-semibold',
          !escrow.recipient || escrow.recipient === '11111111111111111111111111111111' 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-gray-500/20 text-gray-400'
        ]"
      >
        Public: {{ !escrow.recipient || escrow.recipient === '11111111111111111111111111111111' ? 'yes' : 'no' }}
      </span>
      <span
        :class="[
          'px-3 py-1 rounded-lg text-xs font-semibold',
          escrow.expireTimestamp > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-400'
        ]"
      >
        Expire timestamp: {{ escrow.expireTimestamp > 0 ? formatTimestamp(escrow.expireTimestamp * 1000) : 'never' }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import BaseAddressDisplay from './BaseAddressDisplay.vue'
import TokenAmountDisplay from './TokenAmountDisplay.vue'
import { formatTimestamp } from '../utils/formatters'
import { computed } from 'vue'

const props = defineProps({
  escrow: {
    type: Object,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle'])

const isPublicEscrow = computed(() => {
  const NULL_ADDRESS = '11111111111111111111111111111111'
  return !props.escrow.recipient || props.escrow.recipient === NULL_ADDRESS
})

const remainingPercentage = computed(() => {
  if (!props.escrow) return 0
  return ((props.escrow.depositRemaining / props.escrow.depositAmount) * 100).toFixed(2)
})
</script>
