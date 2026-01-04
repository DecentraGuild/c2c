<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click="handleBackdropClick">
    <div class="bg-secondary-bg rounded-xl p-6 max-w-md w-full mx-4 border border-border-color" @click.stop>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-text-primary">{{ title }}</h3>
        <button @click="handleCancel" class="text-text-muted hover:text-text-primary transition-colors">
          <Icon icon="mdi:close" class="w-5 h-5" />
        </button>
      </div>
      
      <p class="text-text-secondary mb-6">{{ message }}</p>
      
      <div class="flex gap-3">
        <button
          @click="handleCancel"
          class="flex-1 btn-secondary py-2.5"
        >
          {{ cancelText }}
        </button>
        <button
          @click="handleConfirm"
          :disabled="loading"
          class="flex-1 btn-primary py-2.5 disabled:opacity-50"
        >
          <Icon v-if="loading" icon="svg-spinners:ring-resize" class="w-4 h-4 inline mr-2" />
          {{ confirmText }}
        </button>
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
    default: 'Confirm Action'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  loading: {
    type: Boolean,
    default: false
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['confirm', 'cancel', 'update:show'])

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    handleCancel()
  }
}
</script>
