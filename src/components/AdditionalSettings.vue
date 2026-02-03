<template>
  <div class="space-y-2">
    <button
      @click="expanded = !expanded"
      class="w-full flex items-center justify-between text-text-primary font-semibold text-sm"
    >
      <div class="flex items-center gap-2">
        <Icon icon="mdi:cog" class="w-4 h-4" />
        <span>Additional settings</span>
      </div>
      <Icon
        :icon="expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'"
        class="w-4 h-4 transition-transform"
      />
    </button>

    <div v-if="expanded" class="bg-secondary-bg/50 rounded-xl p-3 space-y-3">
      <!-- Direct Counterparty -->
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-text-primary text-sm font-medium">Direct</p>
          <p class="text-xs text-text-muted">Only a single address/account can fill.</p>
        </div>
        <ToggleSwitch v-model="localDirect" />
      </div>

      <!-- Direct Address Input -->
      <div v-if="localDirect" class="ml-0 sm:ml-4 space-y-1.5">
        <label class="block text-xs font-semibold text-text-secondary">Counterparty Address</label>
        <input
          v-model="localDirectAddress"
          type="text"
          placeholder="Enter Solana wallet address"
          class="input-field w-full min-h-[44px]"
        />
      </div>

      <!-- Whitelist Counterparty - DISABLED (Coming in separate tool) -->
      <div class="flex items-center justify-between opacity-50 cursor-not-allowed">
        <div class="flex-1">
          <p class="text-text-primary text-sm font-medium">Whitelist</p>
          <p class="text-xs text-text-muted">Coming soon - Manage on-chain whitelists and create special groups</p>
        </div>
        <ToggleSwitch :model-value="false" disabled />
      </div>

      <!-- Expire Date -->
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-text-primary text-sm font-medium">Expire</p>
          <p class="text-xs text-text-muted">Set an expire timestamp in UTC.</p>
        </div>
        <ToggleSwitch v-model="localExpire" />
      </div>

      <!-- Expire Date/Time Picker -->
      <div v-if="localExpire" class="ml-0 sm:ml-4">
        <DateTimePicker
          v-model="localExpireDate"
          :show-current-time="true"
          :min-minutes-from-now="5"
          @validation-change="handleExpireValidation"
        />
      </div>

      <!-- Partial Fill -->
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-text-primary text-sm font-medium">Partial-fill</p>
          <p class="text-xs text-text-muted">Allow exchange of partial amounts.</p>
        </div>
        <ToggleSwitch v-model="localPartialFill" />
      </div>

      <!-- Slippage - Only shown when partial fill is enabled -->
      <div v-if="localPartialFill" class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-text-primary text-sm font-medium">Slippage</p>
          <p class="text-xs text-text-muted">Due to decimal rounding in partial fills.</p>
        </div>
        <div class="flex items-center gap-2">
          <input
            v-model.number="localSlippage"
            type="number"
            min="0"
            max="100"
            class="input-field w-16 sm:w-20 text-right min-h-[44px]"
          />
          <span class="text-xs text-text-muted">milli%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import { Icon } from '@iconify/vue'
import ToggleSwitch from './ToggleSwitch.vue'
import { useVModel } from '@/composables/useVModel'

// Lazy load date picker - only loads when expire toggle is enabled
// This saves ~200-300 KB from initial bundle
const DateTimePicker = defineAsyncComponent(() => import('./DateTimePicker.vue'))

const props = defineProps({
  direct: {
    type: Boolean,
    default: false
  },
  directAddress: {
    type: String,
    default: ''
  },
  whitelist: {
    type: Boolean,
    default: false
  },
  whitelistAddresses: {
    type: Array,
    default: () => []
  },
  expire: {
    type: Boolean,
    default: false
  },
  expireDate: {
    type: String,
    default: null
  },
  partialFill: {
    type: Boolean,
    default: false
  },
  slippage: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits([
  'update:direct',
  'update:directAddress',
  'update:whitelist',
  'update:whitelistAddresses',
  'update:expire',
  'update:expireDate',
  'update:partialFill',
  'update:slippage'
])

const expanded = ref(true)

// Use composable to create v-model bindings
const {
  localDirect,
  localDirectAddress,
  localExpire,
  localExpireDate,
  localPartialFill,
  localSlippage
} = useVModel(props, emit, [
  'direct',
  'directAddress',
  'expire',
  'expireDate',
  'partialFill',
  'slippage'
])

// Handle expiration date validation
const expireValidationError = ref(null)
function handleExpireValidation(validation) {
  expireValidationError.value = validation.error
}
</script>
