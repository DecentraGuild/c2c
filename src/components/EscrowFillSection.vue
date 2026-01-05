<template>
  <div v-if="escrow && escrow.status === 'active'" class="card space-y-4">
    <h2 class="text-lg font-bold text-text-primary">Fill Escrow</h2>
    
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

    <!-- Partial Fill Input/Slider -->
    <div v-if="escrow.allowPartialFill" class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="text-sm font-semibold text-text-primary">Amount to Fill</label>
        <div class="text-xs text-text-muted">
          Max: 
          <TokenAmountDisplay
            :token="escrow.requestToken"
            :amount="maxFillAmount"
            :decimals="escrow.requestToken.decimals"
            icon-size="xs"
            container-class="inline-flex"
            amount-class="text-text-muted text-xs"
            ticker-class="text-text-muted text-xs"
          />
        </div>
      </div>
      
      <!-- Slider -->
      <div class="space-y-2">
        <div class="relative">
          <input
            :value="fillAmountPercent"
            @input="$emit('update:fillAmountPercent', Number($event.target.value))"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full h-2 bg-secondary-bg rounded-lg appearance-none cursor-pointer accent-primary-color slider-filled"
            :style="{ '--fill-percent': fillAmountPercent + '%' }"
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
            :model-value="fillAmount"
            @update:model-value="$emit('update:fillAmount', $event)"
            type="text"
            inputmode="decimal"
            :placeholder="getPlaceholderForDecimals(escrow.requestToken.decimals)"
            class="input-field w-full pr-20"
            @input="$emit('updateFillAmountFromInput', $event)"
            @keydown="$emit('handleFillAmountKeydown', $event)"
          />
          <div class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
            {{ escrow.requestToken.symbol || 'Token' }}
          </div>
        </div>
        <div class="flex gap-2 mt-2">
          <button
            v-for="percentage in [25, 50, 75, 100]"
            :key="percentage"
            @click="handlePercentageClick(percentage)"
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

      <!-- Expected Receive -->
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

    <!-- Full Fill Display (when partial fill disabled) -->
    <div v-else class="bg-secondary-bg/50 rounded-xl p-3 space-y-2">
      <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-4 items-start sm:items-center">
        <span class="text-sm text-text-muted">You will pay:</span>
        <TokenAmountDisplay
          :token="escrow.requestToken"
          :amount="escrow.requestAmount"
          :decimals="escrow.requestToken.decimals"
          icon-size="sm"
          container-class="text-left"
        />
      </div>
      <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-4 items-start sm:items-center">
        <span class="text-sm text-text-muted">You will receive:</span>
        <TokenAmountDisplay
          :token="escrow.depositToken"
          :amount="escrow.depositRemaining"
          :decimals="escrow.depositToken.decimals"
          icon-size="sm"
          container-class="text-left"
        />
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
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import TokenAmountDisplay from './TokenAmountDisplay.vue'
import { useDecimalHandling } from '../composables/useDecimalHandling'
import { formatBalance, formatDecimals } from '../utils/formatters'

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

const { getStepForDecimals, getPlaceholderForDecimals } = useDecimalHandling()

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

const handlePercentageClick = (percentage) => {
  emit('setFillPercentage', percentage)
}
</script>

<style scoped>
/* Slider with filled progress bar */
.slider-filled {
  background: linear-gradient(
    to right,
    var(--primary-color, rgb(99, 102, 241)) 0%,
    var(--primary-color, rgb(99, 102, 241)) var(--fill-percent, 0%),
    rgb(55, 65, 81) var(--fill-percent, 0%),
    rgb(55, 65, 81) 100%
  );
}

.slider-filled::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color, rgb(99, 102, 241));
  cursor: pointer;
  border: 2px solid rgb(255, 255, 255);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-filled::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color, rgb(99, 102, 241));
  cursor: pointer;
  border: 2px solid rgb(255, 255, 255);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
