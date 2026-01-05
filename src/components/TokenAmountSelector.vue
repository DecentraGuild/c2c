<template>
  <div class="space-y-1.5">
    <div class="section-banner">{{ type.toUpperCase() }}</div>
    <div class="bg-secondary-bg/50 rounded-b-xl p-3">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
        <!-- Token Selector -->
        <div class="flex-1 min-w-0">
          <label class="block text-xs font-semibold text-text-secondary mb-1.5">{{ label }}</label>
          <div class="relative">
            <button
              @click="showTokenSelector = !showTokenSelector"
              class="input-field w-full flex items-center justify-between min-h-[44px]"
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
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-semibold text-text-secondary">Amount</label>
            <!-- Wallet Balance above input (only for offer type when token is selected) -->
            <div v-if="type === 'offer' && token" class="text-xs text-text-muted hidden sm:block">
              <span v-if="tokenBalance !== undefined && tokenBalance !== null">
                Wallet balance : {{ formatBalance(tokenBalance) }}
              </span>
              <span v-else>Loading balance...</span>
            </div>
          </div>
          <!-- Mobile: Show balance below label -->
          <div v-if="type === 'offer' && token" class="text-xs text-text-muted mb-1.5 sm:hidden">
            <span v-if="tokenBalance !== undefined && tokenBalance !== null">
              Balance: {{ formatBalance(tokenBalance) }}
            </span>
            <span v-else>Loading balance...</span>
          </div>
          <div class="relative">
            <input
              v-model="localAmount"
              type="text"
              inputmode="decimal"
              :placeholder="token ? getPlaceholderForDecimals(token.decimals) : '0.00'"
              class="input-field w-full min-h-[44px]"
              :class="type === 'offer' && token && tokenBalance > 0 ? 'pr-24 sm:pr-32' : ''"
              @input="updateAmount"
              @blur="handleBlur"
              @keydown="handleKeydown"
            />
            <!-- Percentage Buttons inside input (only for offer type) -->
            <div v-if="type === 'offer' && token && tokenBalance > 0" class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 sm:gap-1">
              <button
                v-for="percentage in percentageOptions"
                :key="percentage.value"
                @click.stop="setPercentage(percentage.value)"
                class="px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded bg-secondary-bg/80 text-text-secondary hover:bg-secondary-bg transition-colors min-h-[24px]"
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
import { useDecimalHandling } from '../composables/useDecimalHandling'
import { formatBalance as formatBalanceUtil, truncateAddress, formatDecimals } from '../utils/formatters'

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

// Track if user is actively editing to prevent watch from overwriting input
const isEditing = ref(false)

watch(() => props.amount, (newVal) => {
  // Only update localAmount if user is not actively editing
  if (!isEditing.value) {
    localAmount.value = newVal || ''
  }
})

const updateAmount = (event) => {
  if (event) {
    isEditing.value = true
  }
  
  const inputElement = event?.target
  let rawValue = inputElement?.value || localAmount.value
  
  // Handle empty input
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    localAmount.value = ''
    emit('update:amount', '')
    if (event) {
      setTimeout(() => { isEditing.value = false }, 50)
    }
    return
  }
  
  // Convert to string and trim
  let amountValue = String(rawValue).trim()
  
  // Only apply restrictions for 0-decimal tokens
  if (props.token && props.token.decimals === 0) {
    // Remove decimal point and everything after it
    if (amountValue.includes('.')) {
      amountValue = amountValue.split('.')[0]
      // Update input field
      if (inputElement) {
        const cursorPos = inputElement.selectionStart
        inputElement.value = amountValue
        // Restore cursor position (adjust if needed)
        const newPos = Math.min(cursorPos - 1, amountValue.length)
        setTimeout(() => {
          inputElement.setSelectionRange(newPos, newPos)
        }, 0)
      }
    }
    // Ensure it's a valid integer
    const numValue = parseFloat(amountValue)
    if (!isNaN(numValue)) {
      const intValue = Math.floor(Math.abs(numValue)).toString()
      if (intValue !== amountValue) {
        amountValue = intValue
        if (inputElement) {
          inputElement.value = amountValue
        }
      }
    }
  } else {
    // For tokens with decimals, validate the format
    // Allow: numbers, single decimal point, digits
    // Remove invalid characters but preserve valid decimal input
    const validPattern = /^[0-9]*\.?[0-9]*$/
    if (!validPattern.test(amountValue)) {
      // Remove invalid characters
      amountValue = amountValue.replace(/[^0-9.]/g, '')
      // Ensure only one decimal point
      const parts = amountValue.split('.')
      if (parts.length > 2) {
        amountValue = parts[0] + '.' + parts.slice(1).join('')
      }
      if (inputElement) {
        const cursorPos = inputElement.selectionStart
        inputElement.value = amountValue
        setTimeout(() => {
          inputElement.setSelectionRange(cursorPos, cursorPos)
        }, 0)
      }
    }
  }
  
  // Update values
  if (amountValue === '') {
    localAmount.value = ''
    emit('update:amount', '')
  } else {
    localAmount.value = amountValue
    emit('update:amount', amountValue)
  }
  
  if (event) {
    setTimeout(() => { isEditing.value = false }, 50)
  }
}

const handleBlur = () => {
  isEditing.value = false
  
  // Clean up empty or zero values
  const value = String(localAmount.value || '').trim()
  if (value === '' || value === '0' || value === '0.') {
    localAmount.value = ''
    emit('update:amount', '')
  }
}

const handleKeydown = (event) => {
  // For tokens with 0 decimals, prevent decimal point and invalid characters
  if (props.token && props.token.decimals === 0) {
    if (event.key === '.' || event.key === ',' || event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
      event.preventDefault()
      return false
    }
  } else {
    // For tokens with decimals, allow decimal point but prevent multiple
    if (event.key === '.' && event.target.value.includes('.')) {
      event.preventDefault()
      return false
    }
    // Prevent scientific notation and other invalid characters
    if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
      event.preventDefault()
      return false
    }
  }
}

const setPercentage = (percentage) => {
  if (!props.token || tokenBalance.value <= 0) return
  
  const amount = tokenBalance.value * percentage
  
  // For tokens with 0 decimals, ensure we use whole numbers only
  let formattedAmount
  if (props.token.decimals === 0) {
    formattedAmount = Math.floor(amount).toString()
  } else {
    // Format amount using formatDecimals utility
    formattedAmount = formatDecimals(amount)
  }
  
  // Set isEditing to false temporarily to allow the update
  isEditing.value = false
  
  // Update localAmount and emit directly (don't use updateAmount which expects an event)
  localAmount.value = formattedAmount
  emit('update:amount', formattedAmount)
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

const { getStepForDecimals, getPlaceholderForDecimals } = useDecimalHandling()
</script>
