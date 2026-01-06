/**
 * Formatting utilities for the escrow application
 */

/**
 * Clean and trim a string, removing all whitespace, null bytes, and non-printable characters
 * @param {string|null|undefined} str - String to clean
 * @returns {string|null} Cleaned string or null
 */
export function cleanTokenString(str) {
  if (!str || typeof str !== 'string') return null
  // Remove null bytes, non-printable characters, and trim whitespace
  return str.replace(/\0/g, '').replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim() || null
}

/**
 * Format a number with dynamic decimal places based on value range
 * Supports both positive and negative values
 * @param {number} value - Number to format
 * @returns {string} Formatted number string
 * 
 * Decimal rules:
 * - 0 - 0.01: 9 digits (for very small prices)
 * - 0.01 - 1: 6 digits
 * - 1 - 10: 4 digits
 * - 10 - 100: 2 digits
 * - 100 - 1000: 1 digit
 * - 1000+: 0 digits
 * 
 * Special rule: If there are no non-zero digits after the decimal point
 * (only trailing zeros), automatically use only 1 decimal place.
 */
export function formatDecimals(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }
  
  // Handle zero
  if (value === 0) {
    return '0'
  }
  
  // Get absolute value for range checking
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  
  // Determine decimal places based on absolute value
  let decimals
  if (absValue < 0.01) {
    decimals = 9 // Very small prices need 9 digits
  } else if (absValue < 1) {
    decimals = 6
  } else if (absValue < 10) {
    decimals = 4
  } else if (absValue < 100) {
    decimals = 2
  } else if (absValue < 1000) {
    decimals = 1
  } else {
    decimals = 0
  }
  
  // Format the number
  let formatted = absValue.toFixed(decimals)
  
  // If decimals > 0, check if there are only trailing zeros after decimal point
  // If so, reduce to 1 decimal place (but only if value >= 0.01 to preserve small number precision)
  if (decimals > 0 && absValue >= 0.01) {
    const parts = formatted.split('.')
    if (parts.length === 2) {
      const decimalPart = parts[1]
      // Check if all digits in decimal part are zeros
      if (/^0+$/.test(decimalPart)) {
        // Only trailing zeros, use 1 decimal place instead
        formatted = absValue.toFixed(1)
      }
    }
  }
  
  return `${sign}${formatted}`
}

/**
 * Format a token balance for display
 * @param {number|null|undefined} balance - Token balance
 * @param {number} decimals - Number of decimal places (default: 4, or token decimals if provided)
 * @param {boolean} showLoading - Whether to show 'Loading...' for null/undefined (default: true)
 * @returns {string} Formatted balance
 */
export function formatBalance(balance, decimals = 4, showLoading = true) {
  if (balance === null || balance === undefined) {
    return showLoading ? 'Loading...' : decimals === 0 ? '0' : '0.00'
  }
  if (balance === 0) {
    return decimals === 0 ? '0' : '0.00'
  }
  
  // For 0-decimal tokens, always show whole numbers
  if (decimals === 0) {
    const wholeNumber = Math.floor(Math.abs(balance))
    const sign = balance < 0 ? '-' : ''
    
    if (wholeNumber >= 1000000) {
      return `${sign}${Math.floor(wholeNumber / 1000000)}M`
    } else if (wholeNumber >= 100000) {
      return `${sign}${Math.floor(wholeNumber / 1000)}K`
    }
    return `${sign}${wholeNumber}`
  }
  
  // For tokens with decimals, use dynamic formatting
  if (balance >= 1000000) {
    return `${formatDecimals(balance / 1000000)}M`
  } else if (balance >= 100000) {
    return `${formatDecimals(balance / 1000)}K`
  }
  
  // Use formatDecimals for consistent decimal formatting
  return formatDecimals(balance)
}

/**
 * Truncate a Solana address for display
 * @param {string} address - Full Solana address
 * @param {number} startChars - Number of characters at start (default: 4)
 * @param {number} endChars - Number of characters at end (default: 4)
 * @returns {string} Truncated address
 */
export function truncateAddress(address, startChars = 4, endChars = 4) {
  if (!address) return ''
  if (address.length <= startChars + endChars) return address
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Format a timestamp for display
 * @param {number|string|Date} timestamp - Timestamp to format
 * @param {boolean} includeTime - Whether to include time (default: true)
 * @returns {string} Formatted date/time
 */
export function formatTimestamp(timestamp, includeTime = true) {
  const date = new Date(timestamp)
  
  if (isNaN(date.getTime())) return 'Invalid date'
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  
  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  
  return date.toLocaleDateString('en-US', options)
}

/**
 * Format a number as USD currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format a large number with appropriate suffix
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number
 */
export function formatLargeNumber(num, decimals = 2) {
  if (num === null || num === undefined) return '0'
  if (num === 0) return '0'
  
  const absNum = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  
  if (absNum >= 1e9) {
    return `${sign}${formatDecimals(absNum / 1e9)}B`
  } else if (absNum >= 1e6) {
    return `${sign}${formatDecimals(absNum / 1e6)}M`
  } else if (absNum >= 1e5) {
    return `${sign}${formatDecimals(absNum / 1e3)}K`
  }
  
  // For numbers below 100k, show full number without decimals
  return `${sign}${Math.floor(absNum)}`
}

/**
 * Convert a token amount from display format to smallest units (with decimals)
 * @param {string|number} amount - Amount in display format (e.g., "1.5")
 * @param {number} decimals - Number of decimal places for the token
 * @returns {bigint} Amount in smallest units
 */
export function toSmallestUnits(amount, decimals) {
  if (!amount || amount === '0' || amount === 0) return BigInt(0)
  
  const amountStr = typeof amount === 'number' ? amount.toString() : amount
  const [integerPart, decimalPart = ''] = amountStr.split('.')
  
  // Pad or truncate decimal part to match token decimals
  const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals)
  
  // Combine integer and decimal parts
  const fullAmount = integerPart + paddedDecimal
  
  return BigInt(fullAmount)
}

/**
 * Convert a token amount from smallest units to display format (with decimals)
 * @param {string|number|bigint|BN} amount - Amount in smallest units
 * @param {number} decimals - Number of decimal places for the token
 * @returns {number} Amount in display format
 */
export function fromSmallestUnits(amount, decimals) {
  if (!amount || amount === '0' || amount === 0) return 0
  
  // Handle BN (Anchor BigNumber)
  let amountStr
  if (typeof amount === 'object' && amount.toString) {
    amountStr = amount.toString()
  } else {
    amountStr = amount.toString()
  }
  
  // For 0-decimal tokens, return whole number directly
  if (decimals === 0) {
    return parseInt(amountStr, 10)
  }
  
  // Pad with zeros if needed
  const padded = amountStr.padStart(decimals + 1, '0')
  
  // Split into integer and decimal parts
  const integerPart = padded.slice(0, -decimals) || '0'
  const decimalPart = padded.slice(-decimals)
  
  // Combine and parse as float
  return parseFloat(`${integerPart}.${decimalPart}`)
}

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}