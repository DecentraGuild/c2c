/**
 * Escrow Validation Utilities
 * Provides reusable validation logic for escrow operations
 */

/**
 * Check if user can exchange/fill an escrow
 * @param {Object} escrow - Escrow object
 * @param {string|PublicKey} userPublicKey - User's public key
 * @returns {boolean}
 */
export function canUserExchangeEscrow(escrow, userPublicKey) {
  if (!escrow || !userPublicKey) return false

  // Convert PublicKey to string if needed
  const userKeyString = typeof userPublicKey === 'string' 
    ? userPublicKey 
    : userPublicKey.toString()

  // Can't exchange if you're the maker
  if (escrow.maker === userKeyString) return false

  // Escrow must be active
  if (escrow.status !== 'active') return false

  // Check recipient restriction
  const SYSTEM_PROGRAM = '11111111111111111111111111111111'
  const NULL_ADDRESS = '11111111111111111111111111111111'
  const isPublic = !escrow.recipient || 
                  escrow.recipient === NULL_ADDRESS || 
                  escrow.recipient === SYSTEM_PROGRAM

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
