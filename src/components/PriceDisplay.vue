<template>
  <div class="space-y-1.5">
    <h3 class="text-sm font-semibold text-text-primary mb-2 text-center">Price</h3>
    <div class="bg-secondary-bg/50 rounded-xl p-3 space-y-2">
      <!-- Price Line 1 -->
      <div class="grid grid-cols-[1fr_auto_1fr] items-center text-sm text-text-secondary">
        <div class="flex items-center gap-1.5 justify-end pr-3">
          <BaseTokenImage v-if="offerToken" :token="offerToken" size="sm" />
          <span class="whitespace-nowrap">1 {{ offerSymbol }}</span>
        </div>
        <div class="flex justify-center flex-shrink-0 px-2">
          <Icon icon="mdi:arrow-left-right" class="w-5 h-5 text-text-primary" />
        </div>
        <div class="flex items-center gap-1.5 justify-start pl-3">
          <BaseTokenImage v-if="requestToken" :token="requestToken" size="sm" />
          <span class="whitespace-nowrap">{{ calculatedPrice }} {{ requestSymbol }}</span>
        </div>
      </div>
      
      <!-- Price Line 2 (Reverse) -->
      <div class="grid grid-cols-[1fr_auto_1fr] items-center text-sm text-text-secondary">
        <div class="flex items-center gap-1.5 justify-end pr-3">
          <BaseTokenImage v-if="requestToken" :token="requestToken" size="sm" />
          <span class="whitespace-nowrap">1 {{ requestSymbol }}</span>
        </div>
        <div class="flex justify-center flex-shrink-0 px-2">
          <Icon icon="mdi:arrow-left-right" class="w-5 h-5 text-text-primary" />
        </div>
        <div class="flex items-center gap-1.5 justify-start pl-3">
          <BaseTokenImage v-if="offerToken" :token="offerToken" size="sm" />
          <span class="whitespace-nowrap">{{ reversePrice }} {{ offerSymbol }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import BaseTokenImage from './BaseTokenImage.vue'

const props = defineProps({
  offerToken: {
    type: Object,
    default: null
  },
  requestToken: {
    type: Object,
    default: null
  },
  offerAmount: {
    type: [String, Number],
    default: 0
  },
  requestAmount: {
    type: [String, Number],
    default: 0
  }
})

const offerSymbol = computed(() => {
  if (!props.offerToken) return '???'
  // Use symbol if available, otherwise truncate mint address
  if (props.offerToken.symbol) {
    return props.offerToken.symbol
  }
  if (props.offerToken.mint) {
    return `${props.offerToken.mint.slice(0, 4)}...${props.offerToken.mint.slice(-4)}`
  }
  return '???'
})

const requestSymbol = computed(() => {
  if (!props.requestToken) return '???'
  // Use symbol if available, otherwise truncate mint address
  if (props.requestToken.symbol) {
    return props.requestToken.symbol
  }
  if (props.requestToken.mint) {
    return `${props.requestToken.mint.slice(0, 4)}...${props.requestToken.mint.slice(-4)}`
  }
  return '???'
})

const calculatedPrice = computed(() => {
  if (!props.offerAmount || !props.requestAmount || parseFloat(props.offerAmount) === 0) {
    return '0.000000000'
  }
  const ratio = parseFloat(props.requestAmount) / parseFloat(props.offerAmount)
  return ratio.toFixed(9)
})

const reversePrice = computed(() => {
  if (!props.offerAmount || !props.requestAmount || parseFloat(props.requestAmount) === 0) {
    return '0.000000000'
  }
  const ratio = parseFloat(props.offerAmount) / parseFloat(props.requestAmount)
  return ratio.toFixed(9)
})
</script>
