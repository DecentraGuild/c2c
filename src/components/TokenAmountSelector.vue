<template>
  <div class="space-y-1.5">
    <div class="section-banner">{{ type.toUpperCase() }}</div>
    <div class="bg-secondary-bg/50 rounded-b-xl p-3">
      <div class="flex items-end gap-3">
        <!-- Token Selector -->
        <div class="flex-1">
          <label class="block text-xs font-semibold text-text-secondary mb-1.5">{{ label }}</label>
          <div class="relative">
            <button
              @click="showTokenSelector = !showTokenSelector"
              class="input-field w-full flex items-center justify-between"
            >
              <span v-if="token" class="flex items-center gap-2">
                <BaseTokenImage :token="token" size="sm" />
                <span>{{ token.symbol || truncateAddress(token.mint) }}</span>
              </span>
              <span v-else class="text-text-muted">Select token</span>
              <div class="flex items-center gap-1.5">
                <Icon
                  v-if="token"
                  icon="mdi:close-circle"
                  class="w-4 h-4 text-text-muted hover:text-text-primary cursor-pointer"
                  @click.stop="clearToken"
                />
                <Icon icon="mdi:chevron-down" class="w-4 h-4" />
              </div>
            </button>
            <!-- Token Selector Dropdown -->
            <TokenSelector
              v-if="type === 'offer'"
              :show="showTokenSelector"
              @select="selectToken"
              @close="showTokenSelector = false"
            />
            <RequestTokenSelector
              v-else
              :show="showTokenSelector"
              @select="selectToken"
              @close="showTokenSelector = false"
            />
          </div>
        </div>

        <!-- Amount Input -->
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-semibold text-text-secondary">Amount</label>
            <!-- Wallet Balance above input (only for offer type when token is selected) -->
            <div v-if="type === 'offer' && token" class="text-xs text-text-muted">
              <span v-if="tokenBalance !== undefined && tokenBalance !== null">
                Wallet balance : {{ formatBalance(tokenBalance) }}
              </span>
              <span v-else>Loading balance...</span>
            </div>
          </div>
          <div class="relative">
            <input
              v-model="localAmount"
              type="number"
              :step="token ? getStepForDecimals(token.decimals) : '0.01'"
              min="0"
              :placeholder="token ? getPlaceholderForDecimals(token.decimals) : '0.00'"
              class="input-field w-full"
              :class="type === 'offer' && token && tokenBalance > 0 ? 'pr-32' : ''"
              @input="updateAmount"
            />
            <!-- Percentage Buttons inside input (only for offer type) -->
            <div v-if="type === 'offer' && token && tokenBalance > 0" class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button
                v-for="percentage in percentageOptions"
                :key="percentage.value"
                @click.stop="setPercentage(percentage.value)"
                class="px-1.5 py-0.5 text-xs font-medium rounded bg-secondary-bg/80 text-text-secondary hover:bg-secondary-bg transition-colors"
              >
                {{ percentage.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Icon } from '@iconify/vue'
import TokenSelector from './TokenSelector.vue'
import RequestTokenSelector from './RequestTokenSelector.vue'
import BaseTokenImage from './BaseTokenImage.vue'
import { useWalletBalances } from '../composables/useWalletBalances'
import { usePercentageButtons } from '../composables/usePercentageButtons'
import { formatBalance as formatBalanceUtil, truncateAddress } from '../utils/formatters'
import { DECIMAL_CONSTANTS } from '../utils/constants'

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['offer', 'request'].includes(value)
  },
  token: {
    type: Object,
    default: null
  },
  amount: {
    type: String,
    default: '0.00'
  },
  showBalance: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:token', 'update:amount'])

const showTokenSelector = ref(false)
const localAmount = ref(props.amount)
const { getTokenBalance } = useWalletBalances()

const label = computed(() => {
  return props.type.charAt(0).toUpperCase() + props.type.slice(1)
})

// Get token balance from wallet
// Prefer balance from token object (when selected from TokenSelector), otherwise fetch from wallet
const tokenBalance = computed(() => {
  if (!props.token || !props.token.mint) return 0
  // If token object has balance property, use it (from TokenSelector)
  if (props.token.balance !== undefined && props.token.balance !== null) {
    return props.token.balance
  }
  // Otherwise, fetch from wallet balances
  return getTokenBalance(props.token.mint)
})

// Percentage options - computed directly for reactivity
const percentageOptions = computed(() => {
  if (!props.token || tokenBalance.value <= 0) return []
  
  const percentages = [25, 50, 75, 100]
  return percentages.map(percent => ({
    label: percent === 100 ? 'MAX' : `${percent}%`,
    value: percent / 100
  }))
})

watch(() => props.amount, (newVal) => {
  localAmount.value = newVal
})

const updateAmount = () => {
  // Ensure amount is always a string for v-model compatibility
  const amountValue = localAmount.value
  emit('update:amount', typeof amountValue === 'number' ? amountValue.toString() : (amountValue || '0.00'))
}

const setPercentage = (percentage) => {
  if (!props.token || tokenBalance.value <= 0) return
  
  const decimals = props.token.decimals || 9
  const amount = tokenBalance.value * percentage
  
  // Format amount based on token decimals
  const formattedAmount = amount.toFixed(Math.min(decimals, 6))
  localAmount.value = formattedAmount
  updateAmount()
}

const selectToken = (token) => {
  emit('update:token', token)
  showTokenSelector.value = false
}

const clearToken = () => {
  emit('update:token', null)
  localAmount.value = '0.00'
  updateAmount()
}

// Use formatBalance from utils
const formatBalance = (balance) => {
  return formatBalanceUtil(balance, 4, true)
}

const getStepForDecimals = (decimals) => {
  if (!decimals || decimals === DECIMAL_CONSTANTS.MIN_DECIMALS) {
    return DECIMAL_CONSTANTS.STEP_VALUES.TWO
  }
  // For tokens with many decimals, use a reasonable step
  // Cap at MAX_STEP_DECIMALS to avoid precision issues
  const displayDecimals = Math.min(decimals, DECIMAL_CONSTANTS.MAX_STEP_DECIMALS)
  // Create step string manually to avoid precision issues
  const { STEP_THRESHOLDS, STEP_VALUES } = DECIMAL_CONSTANTS
  if (displayDecimals <= STEP_THRESHOLDS.TWO) return STEP_VALUES.TWO
  if (displayDecimals <= STEP_THRESHOLDS.FOUR) return STEP_VALUES.FOUR
  if (displayDecimals <= STEP_THRESHOLDS.SIX) return STEP_VALUES.SIX
  if (displayDecimals <= STEP_THRESHOLDS.EIGHT) return STEP_VALUES.EIGHT
  return STEP_VALUES.NINE
}

const getPlaceholderForDecimals = (decimals) => {
  if (!decimals || decimals === DECIMAL_CONSTANTS.MIN_DECIMALS) {
    return `${DECIMAL_CONSTANTS.MIN_DECIMALS}.${'0'.repeat(DECIMAL_CONSTANTS.DEFAULT_DECIMALS)}`
  }
  // Show placeholder with appropriate decimal places (max MAX_DISPLAY_DECIMALS for readability)
  const displayDecimals = Math.min(decimals, DECIMAL_CONSTANTS.MAX_DISPLAY_DECIMALS)
  return `0.${'0'.repeat(displayDecimals)}`
}
</script>
