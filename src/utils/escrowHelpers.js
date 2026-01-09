/**
 * Escrow helper utilities
 * Common functions for escrow data processing and formatting
 */

import { fromSmallestUnits } from './formatters'
import { isPublicRecipient } from './recipientValidation'

/**
 * Calculate escrow status based on account data
 * @param {Object} escrowAccount - Escrow account data from blockchain
 * @returns {string} Status: 'active', 'filled', or 'expired'
 */
export function calculateEscrowStatus(escrowAccount) {
  // Check if filled (no remaining deposit)
  const isFilled = escrowAccount.tokensDepositRemaining.toString() === '0'
  
  if (isFilled) {
    return 'filled'
  }
  
  // Check if expired
  const expireTimestampNum = escrowAccount.expireTimestamp.toNumber()
  const isExpired = expireTimestampNum > 0 && expireTimestampNum < Math.floor(Date.now() / 1000)
  
  if (isExpired) {
    return 'expired'
  }
  
  return 'active'
}

/**
 * Format escrow data from blockchain account
 * @param {Object} escrowData - Raw escrow data from blockchain
 * @param {Object} depositTokenInfo - Deposit token information
 * @param {Object} requestTokenInfo - Request token information
 * @returns {Object} Formatted escrow object
 */
export function formatEscrowData(escrowData, depositTokenInfo, requestTokenInfo) {
  const { account: escrowAccount, publicKey: escrowPubkey } = escrowData
  
  // Calculate amounts in human-readable format
  const depositRemaining = fromSmallestUnits(
    escrowAccount.tokensDepositRemaining.toString(),
    depositTokenInfo.decimals
  )
  const depositInitial = fromSmallestUnits(
    escrowAccount.tokensDepositInit.toString(),
    depositTokenInfo.decimals
  )
  
  // Calculate request amount based on remaining deposit and price
  const requestAmount = depositRemaining * escrowAccount.price
  
  // Determine status
  const status = calculateEscrowStatus(escrowAccount)
  
  // Handle recipient - store as string only if it's not SystemProgram (public)
  const recipientPubkey = escrowAccount.recipient
  let recipientStr = null
  if (recipientPubkey && !isPublicRecipient(recipientPubkey)) {
    recipientStr = recipientPubkey.toString()
  }
  
  return {
    id: escrowPubkey.toString(),
    publicKey: escrowPubkey,
    maker: escrowAccount.maker.toString(),
    depositToken: depositTokenInfo,
    requestToken: requestTokenInfo,
    depositAmount: depositInitial,
    depositRemaining: depositRemaining,
    depositAmountRaw: escrowAccount.tokensDepositInit.toString(),
    depositRemainingRaw: escrowAccount.tokensDepositRemaining.toString(),
    requestAmount: requestAmount,
    price: escrowAccount.price,
    seed: escrowAccount.seed.toString(),
    expireTimestamp: escrowAccount.expireTimestamp.toNumber(),
    recipient: recipientStr,
    recipientPubkey: recipientPubkey, // Keep original PublicKey for program validation
    onlyRecipient: escrowAccount.onlyRecipient,
    onlyWhitelist: escrowAccount.onlyWhitelist,
    allowPartialFill: escrowAccount.allowPartialFill,
    whitelist: escrowAccount.whitelist?.toString() || null,
    status
  }
}

/**
 * Calculate price from amounts
 * @param {number} offerAmount - Offer amount
 * @param {number} requestAmount - Request amount
 * @returns {number} Price (requestAmount / offerAmount)
 */
export function calculatePrice(offerAmount, requestAmount) {
  if (!offerAmount || offerAmount === 0) return 0
  return requestAmount / offerAmount
}
