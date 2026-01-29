<template>
  <div class="flex items-center gap-2">
    <p :class="['font-mono text-sm break-all flex-1', textClass]">
      {{ displayText }}
    </p>
    <button
      v-if="showCopy"
      @click="handleCopy"
      :class="[
        'hover:bg-secondary-bg rounded transition-colors',
        compact ? 'p-0.5' : 'p-1.5'
      ]"
      :title="copyTitle"
    >
      <Icon 
        :icon="isCopying ? 'svg-spinners:ring-resize' : 'mdi:content-copy'" 
        :class="[
          compact ? 'w-3 h-3' : 'w-4 h-4',
          isCopying ? 'text-primary-color' : 'text-text-muted hover:text-text-primary'
        ]" 
      />
    </button>
    <a
      v-if="showExplorer && explorerUrl"
      :href="explorerUrl"
      target="_blank"
      rel="noopener noreferrer"
      :class="[
        'hover:bg-secondary-bg rounded transition-colors',
        compact ? 'p-0.5' : 'p-1.5'
      ]"
      :title="explorerTitle"
    >
      <Icon 
        icon="mdi:open-in-new" 
        :class="[
          'text-text-muted hover:text-text-primary',
          compact ? 'w-3 h-3' : 'w-4 h-4'
        ]" 
      />
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useClipboard } from '../composables/useClipboard'
import { useExplorer } from '../composables/useExplorer'
import { useToast } from '../composables/useToast'
import { truncateAddress } from '../utils/formatters'

const props = defineProps({
  address: {
    type: String,
    required: true
  },
  showCopy: {
    type: Boolean,
    default: true
  },
  showExplorer: {
    type: Boolean,
    default: true
  },
  truncate: {
    type: Boolean,
    default: true
  },
  startChars: {
    type: Number,
    default: 4
  },
  endChars: {
    type: Number,
    default: 4
  },
  textClass: {
    type: String,
    default: 'text-text-primary'
  },
  copyTitle: {
    type: String,
    default: 'Copy address'
  },
  explorerTitle: {
    type: String,
    default: 'View on Solscan'
  },
  explorerType: {
    type: String,
    default: 'account'
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const { copyToClipboard, isCopying } = useClipboard()
const { getSolscanUrl } = useExplorer()
const { success, error: showError } = useToast()

const displayText = computed(() => {
  if (!props.truncate) return props.address
  return truncateAddress(props.address, props.startChars, props.endChars)
})

const explorerUrl = computed(() => {
  return getSolscanUrl(props.address, props.explorerType)
})

const handleCopy = async () => {
  const copied = await copyToClipboard(props.address)
  if (copied) {
    success('Address copied to clipboard!')
  } else {
    showError('Failed to copy address')
  }
}
</script>
