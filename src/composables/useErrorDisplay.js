/**
 * Unified error display composable
 * Consolidates error handling from multiple sources (transaction, store, form)
 */

import { computed } from 'vue'
import { useEscrowStore } from '../stores/escrow'

/**
 * Composable for unified error display
 * @param {Object} options - Options object
 * @param {import('vue').Ref} options.txError - Transaction error ref (optional)
 * @param {string[]} options.errorTypes - Error types to check (default: ['transaction', 'form'])
 * @returns {Object} Error display state and functions
 */
export function useErrorDisplay({ txError = null, errorTypes = ['transaction', 'form'] } = {}) {
  const escrowStore = useEscrowStore()

  /**
   * Get the display error with priority:
   * 1. Transaction error from composable (highest priority)
   * 2. Store transaction error
   * 3. Store form general error
   * 4. First form field error
   */
  const displayError = computed(() => {
    // Check transaction error from composable first (highest priority)
    if (txError?.value) {
      return txError.value
    }

    // Check store transaction error
    if (errorTypes.includes('transaction') && escrowStore.errors.transaction) {
      return escrowStore.errors.transaction
    }

    // Check form general error
    if (errorTypes.includes('form') && escrowStore.errors.form?.general) {
      return escrowStore.errors.form.general
    }

    // Check first form field error
    if (errorTypes.includes('form') && escrowStore.errors.form) {
      const formErrors = escrowStore.errors.form
      const firstError = Object.values(formErrors).find(error => error)
      if (firstError) return firstError
    }

    // Check network errors
    if (errorTypes.includes('network') && escrowStore.errors.network) {
      return escrowStore.errors.network
    }

    // Check escrow errors
    if (errorTypes.includes('escrows') && escrowStore.errors.escrows) {
      return escrowStore.errors.escrows
    }

    return null
  })

  return {
    displayError
  }
}
