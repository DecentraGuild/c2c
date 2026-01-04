<template>
  <div 
    :class="[
      'flex-shrink-0 rounded-full overflow-hidden bg-secondary-bg flex items-center justify-center',
      sizeClass
    ]"
  >
    <img
      v-if="token?.image && !imageError"
      :src="token.image"
      :alt="token.symbol || token.name || 'Token'"
      class="w-full h-full object-cover"
      @error="handleImageError"
      @load="handleImageLoad"
    />
    <Icon v-else :icon="icon" :class="iconClass" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  token: {
    type: Object,
    default: null
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  icon: {
    type: String,
    default: 'mdi:coin'
  }
})

const imageError = ref(false)

const sizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12'
}

const iconSizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
}

const sizeClass = sizeClasses[props.size]
const iconClass = `text-text-muted ${iconSizeClasses[props.size]}`

const handleImageError = (event) => {
  // Silently handle image errors - fallback to icon
  imageError.value = true
  if (event.target) {
    event.target.style.display = 'none'
  }
}

const handleImageLoad = () => {
  // Reset error state if image loads successfully
  imageError.value = false
}

// Reset error state when token changes
watch(() => props.token?.image, () => {
  imageError.value = false
})
</script>
