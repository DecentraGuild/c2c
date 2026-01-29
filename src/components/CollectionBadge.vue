<template>
  <span
    :class="[
      'flex items-center justify-center gap-2 rounded-lg font-bold whitespace-nowrap transition-all cursor-help shadow-sm w-full',
      sizeClasses,
      badgeClass
    ]"
    :title="tooltip"
  >
    <Icon :icon="icon" :class="iconClasses" />
    <span>{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  verificationStatus: {
    type: String,
    default: 'community', // 'community' | 'verified'
    validator: (value) => ['community', 'verified'].includes(value)
  },
  size: {
    type: String,
    default: 'sm', // 'sm' | 'md' | 'lg'
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})

const isVerified = computed(() => props.verificationStatus === 'verified')

const label = computed(() => {
  return isVerified.value ? 'Official Store' : 'Community Store'
})

const icon = computed(() => {
  return isVerified.value ? 'mdi:check-circle' : 'mdi:account-group'
})

const tooltip = computed(() => {
  if (isVerified.value) {
    return 'Official Store – Operated by the collection owner.'
  }
  return 'Community Store – Independently run marketplace'
})

const badgeClass = computed(() => {
  if (isVerified.value) {
    // Official Store - Gold/Verified styling with better contrast
    return 'bg-status-warning/20 text-status-warning border-2 border-status-warning/50 hover:bg-status-warning/30'
  } else {
    // Community Store - Blue/Info styling with better contrast
    return 'bg-status-info/20 text-status-info border-2 border-status-info/50 hover:bg-status-info/30'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-2.5 py-1 text-xs'
    case 'md':
      return 'px-4 py-2 text-sm'
    case 'lg':
      return 'px-5 py-2.5 text-base'
    default:
      return 'px-2.5 py-1 text-xs'
  }
})

const iconClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-3.5 h-3.5'
    case 'md':
      return 'w-4 h-4'
    case 'lg':
      return 'w-5 h-5'
    default:
      return 'w-3.5 h-3.5'
  }
})
</script>
