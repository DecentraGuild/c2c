/**
 * Toast notification composable
 * Provides a simple toast notification system
 */

import { ref } from 'vue'
import { UI_CONSTANTS } from '../utils/constants'

const toasts = ref([])
let toastId = 0

export function useToast() {
  const showToast = (message, type = 'info', duration = UI_CONSTANTS.TOAST_DURATION) => {
    const id = toastId++
    const toast = {
      id,
      message,
      type, // 'success', 'error', 'info', 'warning'
      duration
    }

    toasts.value.push(toast)

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message, duration) => showToast(message, 'success', duration)
  const error = (message, duration) => showToast(message, 'error', duration)
  const info = (message, duration) => showToast(message, 'info', duration)
  const warning = (message, duration) => showToast(message, 'warning', duration)

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning
  }
}
