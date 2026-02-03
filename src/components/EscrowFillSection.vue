<template>
  <div v-if="escrow && escrow.status === 'active'" class="card space-y-4">
    <div class="section-banner bg-gradient-to-r from-secondary-color to-secondary-dark">FILL ESCROW</div>
    
    <!-- Wallet Balance Display -->
    <div class="bg-secondary-bg/50 rounded-xl p-3">
      <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-4 items-start sm:items-center">
        <span class="text-sm text-text-muted">Your {{ escrow.requestToken.symbol || 'Token' }} Balance:</span>
        <span v-if="loadingRequestTokenBalance" class="text-text-muted text-sm whitespace-nowrap">Loading...</span>
        <TokenAmountDisplay
          v-else
          :token="escrow.requestToken"
          :amount="requestTokenBalance"
          :decimals="escrow.requestToken.decimals"
          icon-size="sm"
          container-class="text-left"
        />
      </div>
    </div>

    <!-- Amount to Fill: slider and input (always shown; read-only when partial fill disabled) -->
    <div class="space-y-3">
      <div>
        <label class="text-sm font-semibold text-text-primary">Amount to Fill</label>
      </div>
      
      <!-- Slider -->
      <div class="space-y-2">
        <div class="relative">
          <input
            :value="Math.min(fillAmountPercent, maxFillPercentage)"
            @input="handleSliderInput($event)"
            type="range"
            min="0"
            max="100"
            :step="sliderStep"
            :disabled="!escrow.allowPartialFill"
            class="w-full h-2 bg-secondary-bg rounded-lg appearance-none slider-filled disabled:opacity-60 disabled:cursor-not-allowed"
            :class="{ 'cursor-pointer': escrow.allowPartialFill }"
            style="accent-color: var(--theme-secondary);"
            :style="{ '--fill-percent': Math.min(fillAmountPercent, maxFillPercentage) + '%' }"
          />
        </div>
        <div class="flex justify-between text-xs text-text-muted">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      <!-- Amount Input -->
      <div>
        <label class="text-sm text-text-muted mb-1 block">Fill Amount</label>
        <div class="relative">
          <input
            :model-value="displayFillAmount"
            @update:model-value="handleFillAmountUpdate($event)"
            type="text"
            inputmode="decimal"
            :placeholder="getPlaceholderForDecimals(inputSide === 'request' ? escrow.requestToken.decimals : escrow.depositToken.decimals)"
            class="input-field w-full pr-20 disabled:opacity-60 disabled:cursor-not-allowed"
            :readonly="!escrow.allowPartialFill"
            @input="handleFillAmountInput($event)"
            @keydown="handleFillAmountKeydown($event)"
          />
          <button
            v-if="escrow.allowPartialFill"
            @click="toggleInputSide"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted hover:text-primary-color transition-colors cursor-pointer flex items-center gap-1"
            type="button"
            title="Click to switch between {{ escrow.requestToken.symbol }} and {{ escrow.depositToken.symbol }}"
          >
            <span>{{ inputSide === 'request' ? (escrow.requestToken.symbol || 'Token') : (escrow.depositToken.symbol || 'Token') }}</span>
            <Icon icon="mdi:swap-horizontal" class="w-4 h-4 opacity-60" />
          </button>
          <span v-else class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
            {{ escrow.requestToken.symbol || 'Token' }}
          </span>
        </div>
        <div v-if="escrow.allowPartialFill" class="flex gap-2 mt-2">
          <button
            v-for="percentage in [25, 50, 75, 100]"
            :key="percentage"
            @click="handleWalletBalancePercentageClick(percentage)"
            class="px-3 py-1 text-xs font-medium rounded bg-secondary-bg/50 text-text-secondary hover:bg-secondary-bg transition-colors"
          >
            {{ percentage === 100 ? 'MAX' : `${percentage}%` }}
          </button>
        </div>
      </div>

      <!-- You will pay -->
      <div class="bg-secondary-bg/50 rounded-xl p-3">
        <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-4 items-start sm:items-center">
          <span class="text-sm text-text-muted">You will pay:</span>
          <TokenAmountDisplay
            :token="escrow.requestToken"
            :amount="currentFillAmount"
            :decimals="escrow.requestToken.decimals"
            icon-size="sm"
            container-class="text-left"
          />
        </div>
      </div>

      <!-- You will receive -->
      <div class="bg-secondary-bg/50 rounded-xl p-3">
        <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-4 items-start sm:items-center">
          <span class="text-sm text-text-muted">You will receive:</span>
          <TokenAmountDisplay
            :token="escrow.depositToken"
            :amount="expectedReceiveAmount"
            :decimals="escrow.depositToken.decimals"
            icon-size="sm"
            container-class="text-left"
          />
        </div>
      </div>
    </div>

    <!-- Transaction Fee Info -->
    <div v-if="exchangeCosts" class="bg-secondary-bg/50 rounded-xl p-3 border border-border-color/50">
      <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-4 items-start sm:items-center mb-1">
        <span class="text-sm text-text-muted">Transaction fee:</span>
        <span class="text-text-primary font-semibold whitespace-nowrap">
          {{ formatBalance(exchangeCosts.totalCost, 9) }} SOL
        </span>
      </div>
      <div v-if="exchangeCosts.totalCost > 0" class="text-xs text-text-muted mt-1">
        <span v-if="exchangeCosts.takerAtaCost > 0 || exchangeCosts.takerReceiveAtaCost > 0">
          Includes account creation costs
        </span>
      </div>
    </div>

    <!-- Exchange Button -->
    <button
      @click="$emit('exchange')"
      :disabled="exchanging || !canFill || !canExchange"
      class="btn-primary w-full py-3 sm:py-3 disabled:opacity-50 min-h-[44px] text-sm sm:text-base"
    >
      <Icon v-if="exchanging" icon="svg-spinners:ring-resize" class="w-5 h-5 inline mr-2" />
      <Icon v-else icon="mdi:swap-horizontal" class="w-5 h-5 inline mr-2" />
      {{ escrow.allowPartialFill ? 'FILL ESCROW' : 'EXCHANGE' }}
    </button>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import TokenAmountDisplay from './TokenAmountDisplay.vue'
import { useDecimalHandling } from '@/composables/useDecimalHandling'
import { formatBalance, formatDecimals } from '@/utils/formatters'
import { processAmountInput, shouldPreventKeydown } from '@/utils/inputHandling'

const props = defineProps({
  escrow: {
    type: Object,
    required: true
  },
  requestTokenBalance: {
    type: Number,
    default: 0
  },
  loadingRequestTokenBalance: {
    type: Boolean,
    default: false
  },
  maxFillAmount: {
    type: Number,
    required: true
  },
  maxFillPercentage: {
    type: Number,
    default: 100
  },
  fillAmountPercent: {
    type: Number,
    default: 100
  },
  fillAmount: {
    type: [String, Number],
    default: ''
  },
  expectedReceiveAmount: {
    type: Number,
    required: true
  },
  exchangeCosts: {
    type: Object,
    default: null
  },
  exchanging: {
    type: Boolean,
    default: false
  },
  canFill: {
    type: Boolean,
    default: false
  },
  canExchange: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:fillAmountPercent',
  'update:fillAmount',
  'updateFillAmountFromInput',
  'handleFillAmountKeydown',
  'setFillPercentage',
  'exchange'
])

const { getPlaceholderForDecimals } = useDecimalHandling()

// Track which side is being used for input (request or deposit)
const inputSide = ref('request')

// Calculate slider step based on deposit token decimals
const sliderStep = computed(() => {
  const depositDecimals = props.escrow?.depositToken?.decimals || 0
  const price = props.escrow?.price || 0
  const requestAmount = props.escrow?.requestAmount || 0
  
  // If deposit token has 0 decimals, step should be per unit
  if (depositDecimals === 0 && price > 0 && requestAmount > 0) {
    // Calculate percentage step for 1 unit
    const oneUnitAmount = price
    const oneUnitPercentage = (oneUnitAmount / requestAmount) * 100
    return Math.max(0.1, oneUnitPercentage) // Minimum step of 0.1%
  }
  
  return 0.1 // Default step
})

// Compute current fill amount for display
const currentFillAmount = computed(() => {
  if (!props.escrow || !props.escrow.allowPartialFill) {
    return props.escrow ? props.escrow.requestAmount : 0
  }
  
  if (props.fillAmount && !isNaN(parseFloat(props.fillAmount))) {
    return parseFloat(props.fillAmount)
  }
  
  // Calculate from percentage
  return (props.maxFillAmount * props.fillAmountPercent) / 100
})

// Display fill amount based on input side
const displayFillAmount = computed(() => {
  if (!props.fillAmount || props.fillAmount === '') {
    return ''
  }
  
  const requestAmount = parseFloat(props.fillAmount)
  if (isNaN(requestAmount)) {
    return ''
  }
  
  // If showing request token side, return as is
  if (inputSide.value === 'request') {
    return props.fillAmount
  }
  
  // If showing deposit token side, convert from request amount
  if (!props.escrow || !props.escrow.price || props.escrow.price === 0) {
    return ''
  }
  
  const depositAmount = requestAmount / props.escrow.price
  const depositDecimals = props.escrow.depositToken?.decimals || 0
  
  // If deposit token has 0 decimals, show whole units only
  if (depositDecimals === 0) {
    return Math.floor(depositAmount).toString()
  }
  
  return formatDecimals(depositAmount)
})

// Toggle input side
const toggleInputSide = () => {
  inputSide.value = inputSide.value === 'request' ? 'deposit' : 'request'
  
  // Update display when toggling
  if (props.fillAmount && !isNaN(parseFloat(props.fillAmount))) {
    // The displayFillAmount computed will handle the conversion
  }
}

// Handle fill amount input update
const handleFillAmountUpdate = (value) => {
  emit('update:fillAmount', value)
}

// Handle fill amount input (convert from input side to request token amount)
const handleFillAmountInput = (event) => {
  const inputElement = event?.target
  let rawValue = inputElement?.value || ''
  
  // Handle empty input
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    emit('updateFillAmountFromInput', { ...event, convertedValue: '' })
    return
  }
  
  // Convert to string and trim
  let amountValue = String(rawValue).trim()
  
  // Get decimals based on input side
  const decimals = inputSide.value === 'request' 
    ? (props.escrow?.requestToken?.decimals ?? 9)
    : (props.escrow?.depositToken?.decimals ?? 9)
  
  // Process input based on token decimals
  amountValue = processAmountInput(amountValue, decimals, inputElement)
  
  // Convert to request token amount if input is in deposit token
  let requestTokenAmount = amountValue
  if (inputSide.value === 'deposit' && props.escrow && props.escrow.price && props.escrow.price > 0) {
    const depositAmount = parseFloat(amountValue)
    if (!isNaN(depositAmount)) {
      // If deposit token has 0 decimals, round to whole units
      const depositDecimals = props.escrow.depositToken?.decimals || 0
      const roundedDeposit = depositDecimals === 0 ? Math.floor(depositAmount) : depositAmount
      requestTokenAmount = (roundedDeposit * props.escrow.price).toString()
    }
  }
  
  // If deposit token has 0 decimals, round request token amount to whole units
  const depositDecimals = props.escrow?.depositToken?.decimals || 0
  const price = props.escrow?.price || 0
  if (depositDecimals === 0 && price > 0) {
    const requestAmount = parseFloat(requestTokenAmount)
    if (!isNaN(requestAmount)) {
      const wholeUnits = Math.floor(requestAmount / price)
      requestTokenAmount = (wholeUnits * price).toString()
    }
  }
  
  // Emit with converted value
  const syntheticEvent = {
    ...event,
    target: {
      ...event.target,
      value: requestTokenAmount
    }
  }
  
  emit('updateFillAmountFromInput', syntheticEvent)
}

// Handle keydown with correct decimals
const handleFillAmountKeydown = (event) => {
  const decimals = inputSide.value === 'request' 
    ? (props.escrow?.requestToken?.decimals ?? 9)
    : (props.escrow?.depositToken?.decimals ?? 9)
  
  if (shouldPreventKeydown(event, decimals)) {
    event.preventDefault()
    return false
  }
  
  // Also emit to parent for any additional handling
  emit('handleFillAmountKeydown', event)
}

// Watch fillAmount to update inputSide display when it changes externally
watch(() => props.fillAmount, () => {
  // Keep inputSide as is, displayFillAmount will handle conversion
})

const handlePercentageClick = (percentage) => {
  emit('setFillPercentage', percentage)
}

// Handle wallet balance percentage clicks (25%, 50%, 75%, MAX of wallet balance)
const handleWalletBalancePercentageClick = (percentage) => {
  if (!props.maxFillAmount || props.maxFillAmount === 0) return
  
  // Calculate amount based on wallet balance percentage
  let walletBalanceAmount = (props.maxFillAmount * percentage) / 100
  
  // If deposit token has 0 decimals, round to whole units
  const depositDecimals = props.escrow?.depositToken?.decimals || 0
  const price = props.escrow?.price || 0
  if (depositDecimals === 0 && price > 0) {
    const wholeUnits = Math.floor(walletBalanceAmount / price)
    walletBalanceAmount = wholeUnits * price
  }
  
  // Convert to escrow percentage
  if (!props.escrow || !props.escrow.requestAmount || props.escrow.requestAmount === 0) return
  
  const escrowPercentage = (walletBalanceAmount / props.escrow.requestAmount) * 100
  emit('setFillPercentage', Math.min(escrowPercentage, props.maxFillPercentage))
}

const handleSliderInput = (event) => {
  let value = Number(event.target.value)
  
  // If deposit token has 0 decimals, snap to whole unit increments
  const depositDecimals = props.escrow?.depositToken?.decimals || 0
  const price = props.escrow?.price || 0
  const requestAmount = props.escrow?.requestAmount || 0
  
  if (depositDecimals === 0 && price > 0 && requestAmount > 0) {
    // Calculate percentage step for 1 unit
    const oneUnitAmount = price
    const oneUnitPercentage = (oneUnitAmount / requestAmount) * 100
    // Round to nearest whole unit step
    value = Math.round(value / oneUnitPercentage) * oneUnitPercentage
  }
  
  // Clamp the value to maxFillPercentage
  const clampedValue = Math.min(value, props.maxFillPercentage)
  emit('update:fillAmountPercent', clampedValue)
}
</script>

<style scoped>
/* Slider with filled progress bar */
.slider-filled {
  background: linear-gradient(
    to right,
    var(--theme-secondary) 0%,
    var(--theme-secondary) var(--fill-percent, 0%),
    var(--theme-bg-secondary) var(--fill-percent, 0%),
    var(--theme-bg-secondary) 100%
  );
}

.slider-filled::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--theme-secondary);
  cursor: pointer;
  border: 2px solid var(--theme-text-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-filled::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--theme-secondary);
  cursor: pointer;
  border: 2px solid var(--theme-text-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
