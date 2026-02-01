<template>
  <div
    :class="['collection-scroll-container overflow-y-auto', contentClass]"
    :style="scrollStyle"
  >
    <div class="collection-scroll-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Max height (CSS value, e.g. '12rem', 'max-h-48' not supported – use '12rem' or 'min(60vh, 320px)') */
  maxHeight: {
    type: String,
    default: '12rem'
  },
  /** Additional classes for the scroll container */
  contentClass: {
    type: String,
    default: ''
  }
})

const scrollStyle = computed(() => ({
  maxHeight: props.maxHeight
}))
</script>
