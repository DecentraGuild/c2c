/**
 * Composable for percentage button logic
 * Used in TokenAmountSelector and EscrowDetail for setting amounts by percentage
 */

import { computed } from 'vue'
import { formatDecimals } from '../utils/formatters'

export function usePercentageButtons(options = {}) {
  const {
    maxAmount = 0,
    decimals = 9,
    percentages = [25, 50, 75, 100]
  } = options

  const percentageOptions = computed(() => {
    if (maxAmount <= 0) return []
    
    return percentages.map(percent => ({
      label: percent === 100 ? 'MAX' : `${percent}%`,
      value: percent / 100
    }))
  })

  const setPercentage = (percentage, currentAmount = '') => {
    if (maxAmount <= 0) return currentAmount
    
    const amount = maxAmount * percentage
    
    // For tokens with 0 decimals, ensure we use whole numbers only
    if (decimals === 0) {
      return Math.floor(amount).toString()
    }
    
    // Format amount using formatDecimals utility
    return formatDecimals(amount)
  }

  return {
    percentageOptions,
    setPercentage
  }
}
