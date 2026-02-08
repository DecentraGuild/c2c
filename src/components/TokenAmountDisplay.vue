<template>
  <div class="flex items-center gap-1.5" :class="containerClass">
    <BaseTokenImage :token="token" :size="iconSize" />
    <span :class="amountClass">
      {{ formattedAmount }}
    </span>
    <span :class="tickerClass">
      {{ ticker }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseTokenImage from './BaseTokenImage.vue'
import { formatBalance } from '@/utils/formatters'
import { truncateAddress } from '@/utils/formatters'

const props = defineProps({
  token: {
    type: Object,
    required: true,
    validator: (value) => value && value.mint
  },
  amount: {
    type: [String, Number],
    default: 0
  },
  decimals: {
    type: Number,
    default: null
  },
  iconSize: {
    type: String,
    default: 'sm',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  containerClass: {
    type: String,
    default: ''
  },
  amountClass: {
    type: String,
    default: 'text-text-primary font-semibold whitespace-nowrap'
  },
  tickerClass: {
    type: String,
    default: 'text-text-primary font-semibold whitespace-nowrap'
  }
})

const formattedAmount = computed(() => {
  if (props.amount === null || props.amount === undefined) {
    return '0'
  }
  
  const decimals = props.decimals !== null && props.decimals !== undefined
    ? props.decimals
    : props.token?.decimals

  return formatBalance(props.amount, decimals)
})

const ticker = computed(() => {
  if (!props.token) return 'Token'
  
  // Prefer symbol, fallback to name, then truncated mint address
  if (props.token.symbol) {
    return props.token.symbol
  }
  if (props.token.name) {
    return props.token.name
  }
  if (props.token.mint) {
    return truncateAddress(props.token.mint)
  }
  return 'Token'
})
</script>
