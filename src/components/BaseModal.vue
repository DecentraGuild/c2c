<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click="handleBackdropClick">
    <div 
      :class="[
        'bg-window-bg rounded-xl w-full max-h-[90vh] overflow-hidden border border-window-border shadow-lg collection-scroll-container flex flex-col',
        maxWidth
      ]"
      @click.stop
    >
      <div v-if="showCloseButton || title" class="flex items-center justify-between p-4 sm:p-6 pb-0 flex-shrink-0 bg-window-header rounded-t-xl">
        <h3 v-if="title" class="text-lg font-bold text-text-primary">{{ title }}</h3>
        <div v-else></div>
        <button 
          v-if="showCloseButton"
          @click="handleClose" 
          class="text-text-muted hover:text-text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
          aria-label="Close modal"
        >
          <Icon icon="mdi:close" class="w-5 h-5" />
        </button>
      </div>
      <div class="collection-scroll-content p-4 sm:p-6 overflow-y-auto flex-1">
        <div class="modal-content">
          <slot />
        </div>
        <div v-if="$slots.footer" class="mt-6 pt-4 border-t border-window-border">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  showCloseButton: {
    type: Boolean,
    default: true
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  maxWidth: {
    type: String,
    default: 'max-w-md'
  }
})

const emit = defineEmits(['update:show', 'close'])

const handleClose = () => {
  emit('update:show', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    handleClose()
  }
}
</script>

<style scoped>
.modal-content {
  /* Content area styling */
}
</style>
