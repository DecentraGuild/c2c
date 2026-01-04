<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click="handleBackdropClick">
    <div class="bg-secondary-bg rounded-xl p-6 max-w-md w-full mx-4 border border-border-color" @click.stop>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-text-primary">{{ title }}</h3>
        <button @click="handleClose" class="text-text-muted hover:text-text-primary transition-colors">
          <Icon icon="mdi:close" class="w-5 h-5" />
        </button>
      </div>
      
      <div class="space-y-4">
        <div v-if="showUrl">
          <label class="text-sm text-text-muted mb-2 block">{{ urlLabel }}</label>
          <div class="flex gap-2">
            <input
              :value="url"
              readonly
              class="flex-1 px-3 py-2 bg-primary-bg border border-border-color rounded-lg text-text-primary text-sm"
            />
            <button
              @click="handleCopyUrl"
              class="px-4 py-2 bg-primary-color text-white rounded-lg hover:opacity-80 transition-opacity"
            >
              <Icon 
                :icon="isCopying ? 'svg-spinners:ring-resize' : 'mdi:content-copy'" 
                class="w-5 h-5" 
              />
            </button>
          </div>
        </div>
        
        <div v-if="showQRCode">
          <label class="text-sm text-text-muted mb-2 block">{{ qrLabel }}</label>
          <div class="flex justify-center p-4 bg-white rounded-lg">
            <canvas 
              ref="qrCanvas" 
              :width="qrSize" 
              :height="qrSize"
              class="max-w-full h-auto"
            ></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useClipboard } from '../composables/useClipboard'
import { useQRCode } from '../composables/useQRCode'
import { useToast } from '../composables/useToast'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Share'
  },
  urlLabel: {
    type: String,
    default: 'Link'
  },
  qrLabel: {
    type: String,
    default: 'QR Code'
  },
  showUrl: {
    type: Boolean,
    default: true
  },
  showQRCode: {
    type: Boolean,
    default: true
  },
  qrCanvasClass: {
    type: String,
    default: 'w-48 h-48'
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:show', 'close'])

const { copyToClipboard, isCopying } = useClipboard()
const { generateQRCode } = useQRCode()
const { success, error: showError } = useToast()
const qrCanvas = ref(null)
const qrSize = 200 // QR code size in pixels

const handleClose = () => {
  emit('update:show', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    handleClose()
  }
}

const handleCopyUrl = async () => {
  const copied = await copyToClipboard(props.url)
  if (copied) {
    success('Link copied to clipboard!')
  } else {
    showError('Failed to copy link')
  }
}

// Generate QR code when modal opens
watch(() => props.show, async (isShowing) => {
  if (isShowing && props.showQRCode && props.url) {
    // Wait for DOM to be ready
    await nextTick()
    // Additional small delay to ensure canvas is fully rendered
    await new Promise(resolve => setTimeout(resolve, 50))
    
    if (qrCanvas.value) {
      // Ensure canvas has dimensions
      if (!qrCanvas.value.width || !qrCanvas.value.height) {
        qrCanvas.value.width = qrSize
        qrCanvas.value.height = qrSize
      }
      const success = await generateQRCode(qrCanvas.value, props.url, { width: qrSize })
      if (!success) {
        console.warn('QR code generation failed')
      }
    } else {
      console.warn('QR canvas ref is not available')
    }
  }
}, { immediate: true })

// Also watch for URL changes
watch(() => props.url, async (newUrl) => {
  if (props.show && props.showQRCode && newUrl && qrCanvas.value) {
    await nextTick()
    if (!qrCanvas.value.width || !qrCanvas.value.height) {
      qrCanvas.value.width = qrSize
      qrCanvas.value.height = qrSize
    }
    await generateQRCode(qrCanvas.value, newUrl, { width: qrSize })
  }
})
</script>
