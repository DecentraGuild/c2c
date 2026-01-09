<template>
  <BaseDropdown :show="show" @close="$emit('close')">
    <div class="py-2">
        <!-- Loading State -->
        <div v-if="loading" class="p-4 text-center text-text-muted">
          <Icon icon="svg-spinners:ring-resize" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">Loading balances...</p>
        </div>

        <!-- Loading Metadata State -->
        <div v-else-if="loadingMetadata && balances.length > 0" class="p-2 text-center text-text-muted">
          <p class="text-xs">Loading token metadata...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:alert-circle-outline" class="w-8 h-8 inline-block mb-2 text-status-error" />
          <p class="text-sm text-status-error">{{ error }}</p>
        </div>

        <!-- No Wallet Connected -->
        <div v-else-if="!connected" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:wallet-outline" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">Connect wallet to see tokens</p>
        </div>

        <!-- Empty Balance -->
        <div v-else-if="balances.length === 0" class="p-4 text-center text-text-muted">
          <Icon icon="mdi:wallet-outline" class="w-8 h-8 inline-block mb-2" />
          <p class="text-sm">No tokens found</p>
        </div>

        <!-- Token List -->
        <div v-else class="divide-y divide-border-color">
          <button
            v-for="token in balances"
            :key="token.mint"
            @click="selectToken(token)"
            class="w-full px-4 py-3 hover:bg-secondary-bg/50 transition-colors flex items-center justify-between text-left"
          >
            <TokenDisplay :token="token" />
            <div class="text-right flex-shrink-0 ml-2">
              <div class="text-sm font-medium text-text-primary">
                {{ formatBalance(token.balance, token.decimals) }}
              </div>
            </div>
          </button>
        </div>
    </div>
  </BaseDropdown>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { useTokenStore } from '../stores/token'
import { useWallet } from 'solana-wallets-vue'
import { formatBalance as formatBalanceUtil } from '../utils/formatters'
import BaseDropdown from './BaseDropdown.vue'
import TokenDisplay from './TokenDisplay.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'close'])

const { connected } = useWallet()
const tokenStore = useTokenStore()
// Access store properties directly to maintain reactivity
const balances = computed(() => tokenStore.balances)
const loading = computed(() => tokenStore.loadingBalances)
const error = computed(() => tokenStore.balancesError)
const loadingMetadata = computed(() => tokenStore.loadingMetadata)

const selectToken = (token) => {
  emit('select', token)
  emit('close')
}

// Use formatBalance from utils with token decimals
const formatBalance = (balance, decimals) => {
  return formatBalanceUtil(balance, decimals || 9, false)
}
</script>
