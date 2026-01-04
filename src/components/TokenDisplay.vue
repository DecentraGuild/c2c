<template>
  <div class="flex items-center gap-3 flex-1 min-w-0">
    <BaseTokenImage :token="token" size="md" />
    <div class="flex-1 min-w-0">
      <div class="text-sm font-medium text-text-primary truncate">
        {{ token.symbol || truncateAddress(token.mint) }}
      </div>
      <div class="text-xs text-text-muted truncate">
        {{ token.name || truncateAddress(token.mint) }}
      </div>
      <div v-if="showAddress" class="text-xs text-text-muted font-mono mt-0.5">
        {{ truncateAddress(token.mint) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { truncateAddress } from '../utils/formatters'
import BaseTokenImage from './BaseTokenImage.vue'

const props = defineProps({
  token: {
    type: Object,
    required: true,
    validator: (value) => value && value.mint
  },
  showAddress: {
    type: Boolean,
    default: false
  }
})
</script>
