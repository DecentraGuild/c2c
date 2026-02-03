<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click.self="close"
  >
    <div class="card max-w-lg w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-text-primary">Pricing</h2>
        <button
          @click="close"
          class="p-1 hover:bg-secondary-bg rounded-lg transition-colors"
        >
          <Icon icon="mdi:close" class="w-6 h-6 text-text-muted" />
        </button>
      </div>

      <div class="space-y-4">
        <!-- Transaction Fees -->
        <div>
          <h3 class="text-sm font-semibold text-text-primary mb-2">Transaction Fees</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between py-2 border-b border-border-color/50">
              <span class="text-sm text-text-secondary">Maker fee</span>
              <span class="text-sm font-medium text-text-primary">{{ TRANSACTION_COSTS.PLATFORM_MAKER_FEE }} SOL</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border-color/50">
              <span class="text-sm text-text-secondary">Taker fee</span>
              <span class="text-sm font-medium text-text-primary">{{ TRANSACTION_COSTS.PLATFORM_TAKER_FEE }} SOL</span>
            </div>
          </div>
        </div>

        <!-- Solana Rent Accounts -->
        <div>
          <h3 class="text-sm font-semibold text-text-primary mb-2">Solana Rent Accounts</h3>
          <div class="flex items-center justify-between py-2 border-b border-border-color/50">
            <div class="flex-1">
              <span class="text-sm text-text-secondary block">0.00022 SOL per account</span>
              <span class="text-xs text-text-muted mt-0.5 block">(recoverable, minimal 2 per escrow)</span>
            </div>
          </div>
        </div>

        <!-- Monthly Subscriptions -->
        <div>
          <h3 class="text-sm font-semibold text-text-primary mb-2">
            Monthly Subscriptions
            <span class="text-xs font-normal text-text-muted ml-2">(coming soon)</span>
          </h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between py-2 border-b border-border-color/50">
              <span class="text-sm text-text-secondary">$5/month</span>
              <span class="text-sm font-medium text-text-primary">5 escrows free, 20% discount on rest</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border-color/50">
              <span class="text-sm text-text-secondary">$10/month</span>
              <span class="text-sm font-medium text-text-primary">10 escrows free, 50% discount on rest</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border-color/50">
              <span class="text-sm text-text-secondary">$25/month</span>
              <span class="text-sm font-medium text-text-primary">Free unlimited escrows</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 pt-4 border-t border-border-color">
        <button
          @click="close"
          class="btn-primary w-full py-2"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { TRANSACTION_COSTS } from '@/utils/constants/fees'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show'])

const close = () => {
  emit('update:show', false)
}
</script>
