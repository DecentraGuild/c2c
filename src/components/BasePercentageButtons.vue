<template>
  <div class="flex gap-2">
    <button
      v-for="percentage in percentages"
      :key="percentage"
      @click="setPercentage(percentage)"
      :class="[
        'px-3 py-1 text-xs font-medium rounded bg-secondary-bg/50 text-text-secondary hover:bg-secondary-bg transition-colors',
        buttonClass
      ]"
    >
      {{ percentage === 100 ? 'MAX' : `${percentage}%` }}
    </button>
  </div>
</template>

<script setup>
import { formatDecimals } from '../utils/formatters'

const props = defineProps({
  percentages: {
    type: Array,
    default: () => [25, 50, 75, 100]
  },
  maxValue: {
    type: Number,
    required: true
  },
  modelValue: {
    type: [Number, String],
    default: 0
  },
  decimals: {
    type: Number,
    default: 9
  },
  buttonClass: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const setPercentage = (percentage) => {
  const amount = (props.maxValue * percentage) / 100
  
  // For tokens with 0 decimals, ensure we use whole numbers only
  let formattedAmount
  if (props.decimals === 0) {
    formattedAmount = Math.floor(amount).toString()
  } else {
    formattedAmount = formatDecimals(amount)
  }
  
  emit('update:modelValue', formattedAmount)
}
</script>
