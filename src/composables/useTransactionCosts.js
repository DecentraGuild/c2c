/**
 * Transaction costs composable
 * Handles loading and displaying transaction costs for escrow operations
 */

import { ref, watch } from 'vue'
import { useWallet } from 'solana-wallets-vue'
import { useSolanaConnection } from './useSolanaConnection'
import { calculateEscrowCreationCosts, calculateExchangeCosts, formatCostBreakdown } from '../utils/transactionCosts'
import { useDebounce, DEBOUNCE_DELAYS } from './useDebounce'

/**
 * Composable for transaction cost calculations
 * @param {Object} options - Options object
 * @param {Function} options.costCalculator - Cost calculation function (calculateEscrowCreationCosts or calculateExchangeCosts)
 * @param {Function} options.getParams - Function that returns cost calculation parameters
 * @param {number} options.debounceDelay - Debounce delay in ms (default: 300ms)
 * @returns {Object} Cost state and functions
 */
export function useTransactionCosts({ costCalculator, getParams, debounceDelay = DEBOUNCE_DELAYS.MEDIUM }) {
  const walletAdapter = useWallet()
  const { publicKey, connected } = walletAdapter
  const connection = useSolanaConnection()

  const costBreakdown = ref(null)
  const loadingCosts = ref(false)

  /**
   * Calculate transaction costs
   */
  const calculateCosts = async () => {
    if (!connected.value || !publicKey.value) {
      costBreakdown.value = null
      return
    }

    const params = getParams()
    if (!params) {
      costBreakdown.value = null
      return
    }

    loadingCosts.value = true
    try {
      const costs = await costCalculator({
        ...params,
        connection
      })
      // For exchange costs, return raw costs (not formatted)
      // For creation costs, format the breakdown
      const isExchangeCosts = costCalculator === calculateExchangeCosts
      if (isExchangeCosts) {
        costBreakdown.value = costs
      } else {
        costBreakdown.value = formatCostBreakdown ? formatCostBreakdown(costs) : costs
      }
    } catch (err) {
      console.error('Failed to calculate transaction costs:', err)
      costBreakdown.value = null
    } finally {
      loadingCosts.value = false
    }
  }

  // Debounced version to prevent excessive API calls
  const debouncedCalculateCosts = useDebounce(calculateCosts, debounceDelay)

  return {
    costBreakdown,
    loadingCosts,
    calculateCosts: debouncedCalculateCosts,
    calculateCostsImmediate: calculateCosts
  }
}
