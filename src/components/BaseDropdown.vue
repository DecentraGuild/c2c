<template>
  <!-- Full screen modal (when containerClass includes 'full-screen') -->
  <Teleport to="body" v-if="show && isFullScreen">
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" @click.self="$emit('close')">
      <div :class="containerClass" ref="dropdownRef" @click.stop class="max-w-[95vw] max-h-[95vh]">
        <slot />
      </div>
    </div>
  </Teleport>
  
  <!-- Regular dropdown -->
  <div v-if="show && !isFullScreen" class="absolute top-full left-0 right-0 mt-1 z-50" ref="dropdownRef" @click.stop>
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

// Check if this is a full screen modal (only check for 'full-screen' class, not 'fixed inset-0')
const isFullScreen = computed(() => {
  return props.containerClass.includes('full-screen')
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
