/**
 * Composable for percentage button logic
 * Used in TokenAmountSelector and EscrowDetail for setting amounts by percentage
 */

import { computed } from 'vue'

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

  const setPercentage = (percentage, currentAmount) => {
    if (maxAmount <= 0) return currentAmount
    
    const amount = maxAmount * percentage
    
    // Format amount based on token decimals
    // For display, we'll use appropriate precision
    const formattedAmount = amount.toFixed(Math.min(decimals, 6))
    return formattedAmount
  }

  return {
    percentageOptions,
    setPercentage
  }
}
