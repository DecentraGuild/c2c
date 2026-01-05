<template>
  <div class="card">
    <h2 class="text-sm font-semibold text-text-primary mb-2 text-center">Price</h2>
    <div class="bg-secondary-bg/50 rounded-xl p-3 space-y-2">
      <!-- Price Line 1: 1 depositToken = price * requestToken -->
      <div class="grid grid-cols-[1fr_auto_1fr] items-center text-sm text-text-secondary">
        <div class="flex justify-end pr-3">
          <TokenAmountDisplay
            v-if="escrow.depositToken"
            :token="escrow.depositToken"
            :amount="1"
            :decimals="escrow.depositToken.decimals"
            icon-size="sm"
            amount-class="text-text-secondary whitespace-nowrap"
            ticker-class="text-text-secondary whitespace-nowrap"
          />
        </div>
        <div class="flex justify-center flex-shrink-0 px-2">
          <Icon icon="mdi:arrow-left-right" class="w-5 h-5 text-text-primary" />
        </div>
        <div class="flex justify-start pl-3">
          <TokenAmountDisplay
            v-if="escrow.requestToken"
            :token="escrow.requestToken"
            :amount="escrow.price"
            :decimals="escrow.requestToken.decimals"
            icon-size="sm"
            amount-class="text-text-secondary whitespace-nowrap"
            ticker-class="text-text-secondary whitespace-nowrap"
          />
        </div>
      </div>
      
      <!-- Price Line 2: 1 requestToken = 1/price * depositToken -->
      <div class="grid grid-cols-[1fr_auto_1fr] items-center text-sm text-text-secondary">
        <div class="flex justify-end pr-3">
          <TokenAmountDisplay
            v-if="escrow.requestToken"
            :token="escrow.requestToken"
            :amount="1"
            :decimals="escrow.requestToken.decimals"
            icon-size="sm"
            amount-class="text-text-secondary whitespace-nowrap"
            ticker-class="text-text-secondary whitespace-nowrap"
          />
        </div>
        <div class="flex justify-center flex-shrink-0 px-2">
          <Icon icon="mdi:arrow-left-right" class="w-5 h-5 text-text-primary" />
        </div>
        <div class="flex justify-start pl-3">
          <TokenAmountDisplay
            v-if="escrow.depositToken"
            :token="escrow.depositToken"
            :amount="1 / escrow.price"
            :decimals="escrow.depositToken.decimals"
            icon-size="sm"
            amount-class="text-text-secondary whitespace-nowrap"
            ticker-class="text-text-secondary whitespace-nowrap"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import TokenAmountDisplay from './TokenAmountDisplay.vue'

defineProps({
  escrow: {
    type: Object,
    required: true
  }
})
</script>
