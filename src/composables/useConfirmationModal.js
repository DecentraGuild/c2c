/**
 * Confirmation Modal Composable
 * Provides reusable confirmation modal state and logic
 */

import { ref } from 'vue'

export function useConfirmationModal() {
  const showConfirm = ref(false)
  const confirmTitle = ref('')
  const confirmMessage = ref('')
  const pendingAction = ref(null)
  const loading = ref(false)

  /**
   * Show confirmation modal
   * @param {string} title - Modal title
   * @param {string} message - Modal message
   * @param {Function} action - Action to execute on confirm
   */
  const show = (title, message, action) => {
    confirmTitle.value = title
    confirmMessage.value = message
    pendingAction.value = action
    showConfirm.value = true
  }

  /**
   * Handle confirm action
   */
  const handleConfirm = async () => {
    if (pendingAction.value) {
      loading.value = true
      try {
        await pendingAction.value()
        showConfirm.value = false
      } finally {
        loading.value = false
        pendingAction.value = null
      }
    }
  }

  /**
   * Close modal without executing action
   */
  const close = () => {
    showConfirm.value = false
    pendingAction.value = null
    loading.value = false
  }

  return {
    showConfirm,
    confirmTitle,
    confirmMessage,
    loading,
    show,
    handleConfirm,
    close
  }
}
