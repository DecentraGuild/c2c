/**
 * Exchange helper utilities
 * Functions for calculating exchange amounts and handling partial fills
 */

import { toSmallestUnits } from './formatters'
import { toBN } from './solanaUtils'

/**
 * Calculate deposit amount to exchange based on fill type
 * @param {Object} options - Options object
 * @param {boolean} options.allowPartialFill - Whether partial fill is allowed
 * @param {number} options.fillAmountPercent - Fill amount percentage (0-100)
 * @param {number} options.currentFillAmount - Current fill amount (request token)
 * @param {number} options.maxFillAmount - Maximum fill amount (request token)
 * @param {number} options.depositRemaining - Remaining deposit amount
 * @param {number} options.price - Exchange price
 * @returns {number} Deposit amount to exchange
 */
export function calculateDepositAmountToExchange({
  allowPartialFill,
  fillAmountPercent,
  currentFillAmount,
  maxFillAmount,
  depositRemaining,
  price
}) {
  if (!allowPartialFill) {
    // Full fill - use remaining deposit
    return depositRemaining
  }
  
  // Check if this is effectively a full fill
  // Compare with a small tolerance to account for floating point precision
  const tolerance = 0.0001
  const isFullFill = fillAmountPercent >= 99.99 || 
                    Math.abs(currentFillAmount - maxFillAmount) < tolerance ||
                    (maxFillAmount > 0 && currentFillAmount >= maxFillAmount * (1 - tolerance))
  
  if (isFullFill) {
    // For full fill, use exact remaining deposit from escrow to avoid slippage
    // This ensures we use the exact amount stored on-chain
    return depositRemaining
  } else {
    // Partial fill - convert fill amount (request token) to deposit token amount
    return currentFillAmount / price
  }
}

/**
 * Prepare exchange amounts for transaction
 * @param {Object} options - Options object
 * @param {number} options.depositAmountToExchange - Deposit amount to exchange
 * @param {number} options.currentFillAmount - Current fill amount (request token)
 * @param {number} options.depositTokenDecimals - Deposit token decimals
 * @param {number} options.requestTokenDecimals - Request token decimals
 * @returns {{depositAmountBN: BN, requestAmountBN: BN}} Exchange amounts as BN
 */
export function prepareExchangeAmounts({
  depositAmountToExchange,
  currentFillAmount,
  depositTokenDecimals,
  requestTokenDecimals
}) {
  // Convert to smallest units
  const depositAmountRaw = toSmallestUnits(
    depositAmountToExchange.toString(),
    depositTokenDecimals
  )
  const depositAmountBN = toBN(depositAmountRaw.toString())
  
  // Calculate request amount needed (for wrapped SOL handling)
  const requestAmountRaw = toSmallestUnits(
    currentFillAmount.toString(),
    requestTokenDecimals
  )
  const requestAmountBN = toBN(requestAmountRaw.toString())
  
  return {
    depositAmountBN,
    requestAmountBN
  }
}
