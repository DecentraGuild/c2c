/**
 * Error Handling Composable
 * Provides centralized error handling logic
 */

import { computed } from 'vue'
import { useEscrowStore } from '../stores/escrow'

export function useErrorHandling() {
  const escrowStore = useEscrowStore()

  /**
   * Get display error from store
   * Checks multiple error types in priority order
   * @param {string[]} types - Error types to check (default: ['transaction', 'form', 'network'])
   * @returns {ComputedRef<string|null>}
   */
  const getDisplayError = (types = ['transaction', 'form', 'network']) => {
    return computed(() => {
      // Check transaction errors first (highest priority)
      if (types.includes('transaction') && escrowStore.errors.transaction) {
        return escrowStore.errors.transaction
      }

      // Check form errors
      if (types.includes('form')) {
        const formErrors = escrowStore.errors.form
        const firstError = Object.values(formErrors)[0]
        if (firstError) return firstError
      }

      // Check network errors
      if (types.includes('network') && escrowStore.errors.network) {
        return escrowStore.errors.network
      }

      // Check escrow errors
      if (types.includes('escrows') && escrowStore.errors.escrows) {
        return escrowStore.errors.escrows
      }

      return null
    })
  }

  return {
    getDisplayError
  }
}
