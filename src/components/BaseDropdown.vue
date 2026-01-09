<template>
  <div v-if="show" class="absolute top-full left-0 right-0 mt-1 z-50" ref="dropdownRef" @click.stop>
    <div :class="containerClass">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  containerClass: {
    type: String,
    default: 'bg-card-bg border border-border-color rounded-xl shadow-xl max-h-64 overflow-y-auto'
  }
})

const emit = defineEmits(['close'])

const dropdownRef = ref(null)

const handleClickOutside = (event) => {
  if (!props.show) return
  
  // Use setTimeout to allow button click to process first
  setTimeout(() => {
    if (!props.show) return
    
    // Check if click is outside the dropdown
    if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
      emit('close')
    }
  }, 0)
}

onMounted(() => {
  // Use capture phase to catch clicks early, but with a delay
  document.addEventListener('click', handleClickOutside, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
})

// Reset state when dropdown closes
watch(() => props.show, (isShowing) => {
  if (!isShowing) {
    // Emit close event to allow parent to reset state if needed
    // This is optional - parent can watch show prop directly
  }
})
</script>
