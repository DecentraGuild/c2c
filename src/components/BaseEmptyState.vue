<template>
  <div :class="['card p-12 text-center', containerClass]">
    <Icon 
      :icon="icon" 
      :class="['w-16 h-16 text-text-muted/30 mx-auto mb-4', iconClass]"
    />
    <p v-if="title" :class="['text-text-secondary', titleClass]">
      {{ title }}
    </p>
    <p v-if="message" :class="['text-sm text-text-muted mt-2', messageClass]">
      {{ message }}
    </p>
    <slot />
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  icon: {
    type: String,
    default: 'mdi:inbox-outline'
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  containerClass: {
    type: String,
    default: ''
  },
  iconClass: {
    type: String,
    default: ''
  },
  titleClass: {
    type: String,
    default: ''
  },
  messageClass: {
    type: String,
    default: ''
  }
})
</script>
