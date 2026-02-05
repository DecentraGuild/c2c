<template>
  <button
    type="button"
    aria-label="Menu"
    :aria-expanded="open"
    class="nav-icon-btn nav-icon-btn-inactive rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
    @click.stop="$emit('toggle')"
  >
    <Icon :icon="open ? 'mdi:close' : 'mdi:menu'" class="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
  </button>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle'])
</script>
