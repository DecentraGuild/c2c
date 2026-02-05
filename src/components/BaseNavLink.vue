<template>
  <router-link
    :to="to"
    :aria-label="ariaLabel || undefined"
    :class="[baseClass, active ? activeClass : inactiveClass]"
  >
    <slot />
  </router-link>
</template>

<script setup>
defineProps({
  to: {
    type: [String, Object],
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  baseClass: {
    type: String,
    default: ''
  },
  activeClass: {
    type: String,
    default: ''
  },
  inactiveClass: {
    type: String,
    default: ''
  },
  ariaLabel: {
    type: String,
    default: ''
  }
})
</script>
