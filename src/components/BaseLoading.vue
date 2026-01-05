<template>
  <div 
    :class="[
      'flex flex-col items-center justify-center',
      fullScreen ? 'fixed inset-0 bg-primary-bg/80 z-50' : '',
      containerClass
    ]"
  >
    <Icon 
      :icon="icon" 
      :class="[
        'text-text-muted/30',
        sizeClasses[size]
      ]"
    />
    <p v-if="message" :class="['text-text-secondary mt-4', messageClass]">
      {{ message }}
    </p>
    <slot />
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  fullScreen: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: 'svg-spinners:ring-resize'
  },
  containerClass: {
    type: String,
    default: ''
  },
  messageClass: {
    type: String,
    default: 'text-sm'
  }
})

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-16 h-16',
  lg: 'w-24 h-24'
}
</script>
