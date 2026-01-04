/**
 * Formatting utilities for the escrow application
 */

/**
 * Format a token balance for display
 * @param {number|null|undefined} balance - Token balance
 * @param {number} decimals - Number of decimal places (default: 4, or token decimals if provided)
 * @param {boolean} showLoading - Whether to show 'Loading...' for null/undefined (default: true)
 * @returns {string} Formatted balance
 */
export function formatBalance(balance, decimals = 4, showLoading = true) {
  if (balance === null || balance === undefined) {
    return showLoading ? 'Loading...' : '0.00'
  }
  if (balance === 0) return '0.00'
  
  if (balance >= 1000000) {
    return `${(balance / 1000000).toFixed(2)}M`
  } else if (balance >= 1000) {
    return `${(balance / 1000).toFixed(2)}K`
  }
  
  // If decimals is provided (e.g., from token), use it but cap at 6 for readability
  // Otherwise use the default (4)
  const displayDecimals = decimals && decimals > 0 ? Math.min(decimals, 6) : 4
  return balance.toFixed(displayDecimals)
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
    return `${sign}${(absNum / 1e9).toFixed(decimals)}B`
  } else if (absNum >= 1e6) {
    return `${sign}${(absNum / 1e6).toFixed(decimals)}M`
  } else if (absNum >= 1e3) {
    return `${sign}${(absNum / 1e3).toFixed(decimals)}K`
  }
  
  return `${sign}${absNum.toFixed(decimals)}`
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