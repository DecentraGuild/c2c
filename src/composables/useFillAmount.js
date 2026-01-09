/**
 * Fill amount composable
 * Handles fill amount calculations and state for escrow exchanges
 */

import { ref, computed, watch } from 'vue'
import { formatDecimals } from '../utils/formatters'

/**
 * Composable for managing fill amount state and calculations
 * @param {Object} options - Options object
 * @param {import('vue').Ref} options.escrow - Escrow ref
 * @param {import('vue').Ref} options.maxFillAmount - Maximum fill amount ref
 * @param {import('vue').Ref} options.requestTokenBalance - Request token balance ref
 * @returns {Object} Fill amount state and functions
 */
export function useFillAmount({ escrow, maxFillAmount, requestTokenBalance }) {
  const fillAmountPercent = ref(100)
  const fillAmount = ref('')

  // Current fill amount computed
  const currentFillAmount = computed(() => {
    if (!escrow.value || !escrow.value.allowPartialFill) {
      return escrow.value ? escrow.value.requestAmount : 0
    }
    
    if (fillAmount.value && !isNaN(parseFloat(fillAmount.value))) {
      return parseFloat(fillAmount.value)
    }
    
    // Calculate from percentage
    return (maxFillAmount.value * fillAmountPercent.value) / 100
  })

  // Expected receive amount
  const expectedReceiveAmount = computed(() => {
    if (!escrow.value) return 0
    return currentFillAmount.value / escrow.value.price
  })

  // Set fill percentage
  const setFillPercentage = (percentage) => {
    fillAmountPercent.value = percentage
    const amount = (maxFillAmount.value * percentage) / 100
    
    // For tokens with 0 decimals, ensure we use whole numbers only
    if (escrow.value && escrow.value.requestToken.decimals === 0) {
      fillAmount.value = Math.floor(amount).toString()
    } else {
      fillAmount.value = formatDecimals(amount)
    }
  }

  // Update fill amount from input
  const updateFillAmountFromInput = (amountValue) => {
    fillAmount.value = amountValue
    
    // Calculate percentage
    const amount = parseFloat(amountValue)
    if (isNaN(amount) || maxFillAmount.value === 0) {
      fillAmountPercent.value = 0
      return
    }
    
    fillAmountPercent.value = Math.min(100, Math.max(0, (amount / maxFillAmount.value) * 100))
  }

  // Watch fillAmountPercent to update fillAmount
  watch(fillAmountPercent, (newPercent) => {
    if (escrow.value && escrow.value.allowPartialFill) {
      const amount = (maxFillAmount.value * newPercent) / 100
      
      // For tokens with 0 decimals, ensure we use whole numbers only
      if (escrow.value.requestToken.decimals === 0) {
        fillAmount.value = Math.floor(amount).toString()
      } else {
        fillAmount.value = formatDecimals(amount)
      }
    }
  })

  // Watch escrow changes to reset fill amount
  watch(() => escrow.value, (newEscrow) => {
    if (newEscrow) {
      if (newEscrow.allowPartialFill) {
        fillAmountPercent.value = 100
        // Will be set after balance loads
      } else {
        fillAmount.value = ''
        fillAmountPercent.value = 100
      }
    }
  }, { immediate: true })

  // Watch for balance changes to update fill amount
  watch(requestTokenBalance, (newBalance) => {
    if (escrow.value && escrow.value.allowPartialFill && newBalance > 0) {
      // Update fill amount when balance loads
      const amount = Math.min(maxFillAmount.value, newBalance)
      fillAmount.value = formatDecimals(amount)
      if (maxFillAmount.value > 0) {
        fillAmountPercent.value = Math.min(100, (amount / maxFillAmount.value) * 100)
      }
    }
  })

  return {
    fillAmountPercent,
    fillAmount,
    currentFillAmount,
    expectedReceiveAmount,
    setFillPercentage,
    updateFillAmountFromInput
  }
}
