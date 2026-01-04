/**
 * Error Parser Utilities
 * Parses various error types and returns user-friendly messages
 */

/**
 * Parse Anchor program errors into user-friendly messages
 * @param {Error} error - Error object
 * @returns {string|null} User-friendly error message or null if not an Anchor error
 */
export function parseAnchorError(error) {
  if (!error) return null
  
  const errorMessage = error.message || error.toString()
  
  // Anchor error codes (common ones)
  const anchorErrors = {
    '6000': 'Invalid account owner',
    '6001': 'Insufficient funds',
    '6002': 'Invalid mint',
    '6003': 'Invalid owner',
    '6004': 'Escrow recipient validation failed. This escrow can only be filled by a specific recipient.',
    '6005': 'Escrow expired',
    '6006': 'Escrow already filled',
    '6007': 'Invalid escrow state',
    '6008': 'Slippage tolerance exceeded',
    '6009': 'Whitelist validation failed',
    '6010': 'Partial fill not allowed',
    '6011': 'Invalid amount',
    '6012': 'Invalid price',
    '6013': 'Invalid seed',
    '6014': 'Invalid expiration timestamp',
    '6015': 'Invalid recipient address',
    '6016': 'Invalid whitelist',
    '6017': 'Invalid maker',
    '6018': 'Invalid taker',
    '6019': 'Invalid token program',
    '6020': 'Invalid system program'
  }
  
  // Check for Anchor error code in message
  for (const [code, message] of Object.entries(anchorErrors)) {
    if (errorMessage.includes(code) || errorMessage.includes(`Error Code: ${code}`)) {
      return message
    }
  }
  
  // Check for common Anchor error patterns
  if (errorMessage.includes('AnchorError') || errorMessage.includes('ProgramError')) {
    // Try to extract error name
    const errorNameMatch = errorMessage.match(/Error Name: (\w+)/)
    if (errorNameMatch) {
      const errorName = errorNameMatch[1]
      const friendlyNames = {
        'InsufficientFunds': 'Insufficient funds for this transaction',
        'InvalidAccount': 'Invalid account provided',
        'ConstraintRaw': 'Transaction constraint violation',
        'ConstraintOwner': 'Account ownership constraint failed',
        'ConstraintSigner': 'Missing required signature',
        'ConstraintHasOne': 'Account relationship constraint failed',
        'EscrowRecipientError': 'Escrow recipient validation failed. This escrow can only be filled by a specific recipient.',
        'EscrowExpired': 'This escrow has expired',
        'EscrowFilled': 'This escrow has already been filled',
        'SlippageExceeded': 'Slippage tolerance exceeded. Try adjusting your slippage settings.',
        'WhitelistError': 'You are not authorized to fill this escrow (whitelist restriction)'
      }
      
      if (friendlyNames[errorName]) {
        return friendlyNames[errorName]
      }
    }
  }
  
  return null
}

/**
 * Parse network/RPC errors into user-friendly messages
 * @param {Error} error - Error object
 * @returns {string|null} User-friendly error message or null if not a network error
 */
export function parseNetworkError(error) {
  if (!error) return null
  
  const errorMessage = error.message || error.toString().toLowerCase()
  
  // Network error patterns
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.'
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return 'Request timed out. The network may be slow. Please try again.'
  }
  
  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  
  if (errorMessage.includes('503') || errorMessage.includes('service unavailable')) {
    return 'Service temporarily unavailable. Please try again in a moment.'
  }
  
  if (errorMessage.includes('rpc') || errorMessage.includes('rpc error')) {
    return 'RPC connection error. Please try again or switch networks.'
  }
  
  return null
}

/**
 * Parse wallet errors into user-friendly messages
 * @param {Error} error - Error object
 * @returns {string|null} User-friendly error message or null if not a wallet error
 */
export function parseWalletError(error) {
  if (!error) return null
  
  const errorMessage = error.message || error.toString().toLowerCase()
  
  if (errorMessage.includes('user rejected') || errorMessage.includes('user cancel')) {
    return 'Transaction cancelled by user'
  }
  
  if (errorMessage.includes('wallet not connected') || errorMessage.includes('no wallet')) {
    return 'Please connect your wallet first'
  }
  
  if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient sol')) {
    return 'Insufficient SOL balance. You need SOL to pay for transaction fees.'
  }
  
  if (errorMessage.includes('invalid signature')) {
    return 'Transaction signature invalid. Please try again.'
  }
  
  return null
}

/**
 * Get user-friendly error message from any error
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default message if parsing fails
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyError(error, defaultMessage = 'An unexpected error occurred. Please try again.') {
  if (!error) return defaultMessage
  
  // Try parsing in order of specificity
  const anchorError = parseAnchorError(error)
  if (anchorError) return anchorError
  
  const walletError = parseWalletError(error)
  if (walletError) return walletError
  
  const networkError = parseNetworkError(error)
  if (networkError) return networkError
  
  // If error has a message, use it (might already be user-friendly)
  if (error.message && error.message !== 'Error') {
    return error.message
  }
  
  return defaultMessage
}

/**
 * Check if error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} True if error is retryable
 */
export function isRetryableError(error) {
  if (!error) return false
  
  const errorMessage = error.message || error.toString().toLowerCase()
  
  // Network errors are usually retryable
  if (errorMessage.includes('network') || 
      errorMessage.includes('timeout') || 
      errorMessage.includes('503') ||
      errorMessage.includes('rate limit')) {
    return true
  }
  
  // RPC errors might be retryable
  if (errorMessage.includes('rpc error') && !errorMessage.includes('invalid')) {
    return true
  }
  
  // User rejection is not retryable
  if (errorMessage.includes('user rejected') || errorMessage.includes('user cancel')) {
    return false
  }
  
  // Program errors are usually not retryable (except for network issues)
  if (errorMessage.includes('anchor') || errorMessage.includes('program')) {
    return false
  }
  
  return false
}
