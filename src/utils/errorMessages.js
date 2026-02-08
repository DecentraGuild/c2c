/**
 * Centralized error message formatting.
 * Single place for user-facing error copy; use formatUserFriendlyError in catch blocks and toasts.
 * For custom UI (e.g. per-storefront messages), this module is the extension point: add an optional
 * message map or override layer here rather than scattering strings elsewhere.
 */

/** Form validation messages (create escrow and validators) */
export const FORM_MESSAGES = {
  SELECT_OFFER_TOKEN: 'Please select a token to offer',
  SELECT_REQUEST_TOKEN: 'Please select a token to request',
  VALID_OFFER_AMOUNT: 'Please enter a valid offer amount',
  VALID_REQUEST_AMOUNT: 'Please enter a valid request amount',
  TOKENS_MUST_DIFFER: 'Offer and request tokens must be different'
}

/** Escrow/blockchain load messages */
export const ESCROW_MESSAGES = {
  INVALID_DATA: 'Invalid data received from blockchain',
  MISSING_DECIMALS: 'Missing decimals for deposit or request token'
}

/** Network/offline messages */
export const NETWORK_MESSAGES = {
  OFFLINE_WARNING: 'You are offline. Some features may not work.'
}

/**
 * Format error message from various sources
 * @param {Error|string|Object} error - Error object, string, or error-like object
 * @param {string} defaultMessage - Default message if error cannot be parsed
 * @returns {string} Formatted error message
 */
export function formatErrorMessage(error, defaultMessage = 'An error occurred') {
  if (!error) {
    return defaultMessage
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error
  }

  // If it's an Error object, get the message
  if (error instanceof Error) {
    return error.message || defaultMessage
  }

  // If it's an object with a message property
  if (error && typeof error === 'object' && 'message' in error) {
    return error.message || defaultMessage
  }

  // If it's an object with an error property
  if (error && typeof error === 'object' && 'error' in error) {
    return formatErrorMessage(error.error, defaultMessage)
  }

  return defaultMessage
}

/**
 * Format user-friendly error message from Solana/Anchor errors
 * @param {Error|string} error - Error object or string
 * @param {string} context - Context of the error (e.g., 'create escrow', 'exchange escrow')
 * @returns {string} User-friendly error message
 */
export function formatUserFriendlyError(error, context = '') {
  const message = formatErrorMessage(error)
  
  // Remove technical details that users don't need
  let friendlyMessage = message
  
  // Replace common technical error codes with user-friendly messages
  if (message.includes('6004') || message.includes('EscrowRecipientError')) {
    return 'This escrow can only be filled by a specific recipient. Please check the escrow details.'
  }
  
  if (message.includes('6001') || message.includes('InsufficientFunds')) {
    return 'Insufficient funds. Please check your wallet balance.'
  }
  
  if (message.includes('6002') || message.includes('InvalidAmount')) {
    return 'Invalid amount. Please check your input.'
  }
  
  if (message.includes('6003') || message.includes('EscrowExpired')) {
    return 'This escrow has expired.'
  }
  
  if (message.includes('6005') || message.includes('WhitelistError')) {
    return 'You are not authorized to fill this escrow. It requires whitelist access.'
  }
  
  if (message.includes('User rejected')) {
    return 'Transaction was cancelled.'
  }
  
  if (message.includes('Network request failed') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }
  
  // Add context if provided
  if (context && !friendlyMessage.toLowerCase().includes(context.toLowerCase())) {
    return `Failed to ${context}: ${friendlyMessage}`
  }
  
  return friendlyMessage
}
