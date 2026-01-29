<template>
  <div class="relative" :class="containerClass">
    <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      type="text"
      :placeholder="placeholder"
      :class="[
        'w-full pl-10 pr-4 py-2 bg-secondary-bg border border-border-color rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-color focus:border-transparent transition-all',
        inputClass
      ]"
    />
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search...'
  },
  containerClass: {
    type: String,
    default: ''
  },
  inputClass: {
    type: String,
    default: 'text-sm'
  }
})

defineEmits(['update:modelValue'])
</script>
