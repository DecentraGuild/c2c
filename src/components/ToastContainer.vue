<template>
  <Teleport to="body">
    <div class="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto min-w-[300px] max-w-md rounded-xl p-4 shadow-xl border backdrop-blur-sm',
            getToastClasses(toast.type)
          ]"
        >
          <div class="flex items-start gap-3">
            <Icon :icon="getToastIcon(toast.type)" :class="['flex-shrink-0', getIconClasses(toast.type)]" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium" :class="getTextClasses(toast.type)">
                {{ toast.message }}
              </p>
            </div>
            <button
              @click="removeToast(toast.id)"
              class="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors"
            >
              <Icon icon="mdi:close" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const getToastClasses = (type) => {
  const baseClasses = 'bg-secondary-bg border-border-color'
  const typeClasses = {
    success: 'border-status-success/30 bg-status-success/10',
    error: 'border-status-error/30 bg-status-error/10',
    info: 'border-primary-color/30 bg-primary-color/10',
    warning: 'border-status-warning/30 bg-status-warning/10'
  }
  return `${baseClasses} ${typeClasses[type] || ''}`
}

const getIconClasses = (type) => {
  const baseClasses = 'w-5 h-5'
  const typeClasses = {
    success: 'text-status-success',
    error: 'text-status-error',
    info: 'text-primary-color',
    warning: 'text-status-warning'
  }
  return `${baseClasses} ${typeClasses[type] || 'text-text-muted'}`
}

const getTextClasses = (type) => {
  const typeClasses = {
    success: 'text-status-success',
    error: 'text-status-error',
    info: 'text-primary-light',
    warning: 'text-status-warning'
  }
  return typeClasses[type] || 'text-text-primary'
}

const getToastIcon = (type) => {
  const icons = {
    success: 'mdi:check-circle',
    error: 'mdi:alert-circle',
    info: 'mdi:information',
    warning: 'mdi:alert'
  }
  return icons[type] || 'mdi:information'
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
