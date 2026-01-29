<template>
  <div class="flex items-center gap-2 bg-secondary-bg rounded-lg p-1">
    <button
      v-for="mode in modes"
      :key="mode.value"
      @click="$emit('update:modelValue', mode.value)"
      :class="[
        'p-2 rounded transition-colors',
        modelValue === mode.value 
          ? 'bg-primary-color text-white' 
          : 'text-text-secondary hover:text-primary-color'
      ]"
      :aria-label="mode.label"
    >
      <Icon :icon="mode.icon" class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  modes: {
    type: Array,
    default: () => [
      { value: 'list', label: 'List view', icon: 'mdi:view-list' },
      { value: 'card', label: 'Card view', icon: 'mdi:view-grid' }
    ]
  }
})

defineEmits(['update:modelValue'])
</script>
