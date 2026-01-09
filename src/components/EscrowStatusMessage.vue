<template>
  <div v-if="escrow" class="card">
    <div 
      :class="[
        'section-banner',
        statusClass
      ]"
    >
      {{ statusText }}
    </div>
    <div class="p-4 space-y-2">
      <p class="text-sm text-text-secondary">
        {{ statusDescription }}
      </p>
      <div v-if="escrow.status === 'filled'" class="bg-secondary-bg/50 rounded-lg p-3 mt-3">
        <p class="text-xs text-text-muted">
          This escrow has been successfully filled. The deposit tokens have been exchanged and the escrow is complete.
        </p>
      </div>
      <div v-else-if="escrow.status === 'expired'" class="bg-status-warning/10 border border-status-warning/20 rounded-lg p-3 mt-3">
        <p class="text-xs text-status-warning">
          This escrow has expired. Only the maker can claim back the deposit.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  escrow: {
    type: Object,
    required: true
  }
})

const statusText = computed(() => {
  switch (props.escrow?.status) {
    case 'filled':
      return 'ESCROW FILLED'
    case 'expired':
      return 'ESCROW EXPIRED'
    case 'active':
      return 'ESCROW ACTIVE'
    default:
      return 'ESCROW'
  }
})

const statusClass = computed(() => {
  switch (props.escrow?.status) {
    case 'filled':
      return 'bg-primary-color/20 text-primary-color'
    case 'expired':
      return 'bg-status-warning/20 text-status-warning'
    case 'active':
      return 'bg-status-success/20 text-status-success'
    default:
      return 'bg-text-muted/20 text-text-muted'
  }
})

const statusDescription = computed(() => {
  switch (props.escrow?.status) {
    case 'filled':
      return 'This escrow has been completed. All tokens have been exchanged.'
    case 'expired':
      return 'This escrow has expired and can no longer be filled.'
    case 'active':
      return 'This escrow is active and can be filled.'
    default:
      return 'Escrow status unknown.'
  }
})
</script>
