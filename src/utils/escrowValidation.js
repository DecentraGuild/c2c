/**
 * Escrow Validation Utilities
 * Provides reusable validation logic for escrow operations
 */

import { SYSTEM_PROGRAM_ID_STR } from '@/utils/constants/tokens'

/**
 * Check if user can exchange/fill an escrow
 * @param {Object} escrow - Escrow object
 * @param {string|PublicKey} userPublicKey - User's public key
 * @returns {boolean}
 */
export function canUserExchangeEscrow(escrow, userPublicKey) {
  if (!escrow || !userPublicKey) return false

  const userKeyString = typeof userPublicKey === 'string' 
    ? userPublicKey 
    : userPublicKey.toString()

  if (escrow.maker === userKeyString) return false
  if (escrow.status !== 'active') return false

  const isPublic = !escrow.recipient || 
                  escrow.recipient === SYSTEM_PROGRAM_ID_STR

  // If escrow has a recipient and onlyRecipient is true, taker must match recipient
  if (escrow.recipient && escrow.onlyRecipient) {
    return escrow.recipient === userKeyString
  }

  // If escrow has a recipient but onlyRecipient is false, anyone can fill
  // (but program may still check - this is just UI validation)
  if (escrow.recipient && !isPublic) {
    // Allow it and let the program reject if wrong
    return true
  }

  // Public escrow - anyone can fill
  return true
}
