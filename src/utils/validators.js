/**
 * Validation utilities for the escrow application
 */

import { PublicKey } from '@solana/web3.js'

/**
 * Validate a Solana address
 * @param {string} address - Address to validate
 * @returns {{valid: boolean, error: string|null}} Validation result
 */
export function validateSolanaAddress(address) {
  if (!address || typeof address !== 'string') {
    return {
      valid: false,
      error: 'Address is required'
    }
  }
  
  const trimmed = address.trim()
  
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Address cannot be empty'
    }
  }
  
  try {
    new PublicKey(trimmed)
    return {
      valid: true,
      error: null
    }
  } catch (e) {
    return {
      valid: false,
      error: 'Invalid Solana address format'
    }
  }
}

/**
 * Validate a token amount
 * @param {string|number} amount - Amount to validate
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum allowed value (default: 0)
 * @param {number|null} options.max - Maximum allowed value (default: null)
 * @param {number|null} options.balance - Available balance to check against
 * @param {number|null} options.decimals - Token decimals (for validation)
 * @returns {{valid: boolean, error: string|null}} Validation result
 */
export function validateAmount(amount, options = {}) {
  const {
    min = 0,
    max = null,
    balance = null,
    decimals = null
  } = options
  
  if (!amount && amount !== 0) {
    return {
      valid: false,
      error: 'Amount is required'
    }
  }
  
  const amountStr = typeof amount === 'string' ? amount : amount.toString()
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return {
      valid: false,
      error: 'Invalid amount format'
    }
  }
  
  // For tokens with 0 decimals, ensure the amount is a whole number
  if (decimals === 0) {
    // Check if the string representation contains a decimal point
    if (amountStr.includes('.')) {
      // Check if there are any non-zero digits after the decimal point
      const decimalPart = amountStr.split('.')[1]
      if (decimalPart && decimalPart.length > 0) {
        // Check if there are any non-zero digits
        if (decimalPart.split('').some(digit => digit !== '0')) {
          return {
            valid: false,
            error: 'This token does not support decimals. Please enter a whole number.'
          }
        }
      }
    }
    // Also ensure the numeric value is an integer
    if (!Number.isInteger(numAmount)) {
      return {
        valid: false,
        error: 'This token does not support decimals. Please enter a whole number.'
      }
    }
  }
  
  if (numAmount < min) {
    return {
      valid: false,
      error: `Amount must be at least ${min}`
    }
  }
  
  if (max !== null && numAmount > max) {
    return {
      valid: false,
      error: `Amount cannot exceed ${max}`
    }
  }
  
  if (balance !== null && numAmount > balance) {
    return {
      valid: false,
      error: 'Insufficient balance'
    }
  }
  
  return {
    valid: true,
    error: null
  }
}

/**
 * Validate a list of Solana addresses
 * @param {string[]} addresses - Array of addresses to validate
 * @returns {{valid: boolean, errors: string[], validAddresses: string[]}} Validation result
 */
export function validateAddressList(addresses) {
  if (!Array.isArray(addresses)) {
    return {
      valid: false,
      errors: ['Invalid address list format'],
      validAddresses: []
    }
  }
  
  const errors = []
  const validAddresses = []
  
  addresses.forEach((address, index) => {
    const result = validateSolanaAddress(address)
    if (result.valid) {
      validAddresses.push(address.trim())
    } else {
      errors.push(`Address ${index + 1}: ${result.error}`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors,
    validAddresses
  }
}

/**
 * Validate an expiration date (all comparisons in UTC)
 * @param {string|Date} expirationDate - Date to validate (should be in UTC)
 * @param {number} minMinutesFromNow - Minimum minutes from now (default: 5)
 * @returns {{valid: boolean, error: string|null}} Validation result
 */
export function validateExpirationDate(expirationDate, minMinutesFromNow = 5) {
  if (!expirationDate) {
    return {
      valid: false,
      error: 'Expiration date is required'
    }
  }
  
  const date = new Date(expirationDate)
  
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      error: 'Invalid date format'
    }
  }
  
  // Get current UTC time
  const now = new Date()
  const nowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  )
  
  // Calculate minimum date in UTC (now + minMinutesFromNow)
  const minDateUTC = nowUTC + (minMinutesFromNow * 60 * 1000)
  
  // Get selected date in UTC
  const selectedUTC = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    0
  )
  
  if (selectedUTC <= minDateUTC) {
    return {
      valid: false,
      error: `Expiration must be at least ${minMinutesFromNow} minutes from now (UTC)`
    }
  }
  
  return {
    valid: true,
    error: null
  }
}

/**
 * Validate slippage value
 * @param {number} slippage - Slippage value in milli%
 * @param {number} min - Minimum slippage (default: 0)
 * @param {number} max - Maximum slippage (default: 10000)
 * @returns {{valid: boolean, error: string|null}} Validation result
 */
export function validateSlippage(slippage, min = 0, max = 10000) {
  if (slippage === null || slippage === undefined) {
    return {
      valid: false,
      error: 'Slippage value is required'
    }
  }
  
  const numSlippage = typeof slippage === 'string' ? parseFloat(slippage) : slippage
  
  if (isNaN(numSlippage)) {
    return {
      valid: false,
      error: 'Invalid slippage format'
    }
  }
  
  if (numSlippage < min) {
    return {
      valid: false,
      error: `Slippage must be at least ${min} milli%`
    }
  }
  
  if (numSlippage > max) {
    return {
      valid: false,
      error: `Slippage cannot exceed ${max} milli%`
    }
  }
  
  return {
    valid: true,
    error: null
  }
}

/**
 * Validate entire escrow form
 * @param {Object} formData - Form data to validate
 * @returns {{valid: boolean, errors: Object}} Validation result
 */
export function validateEscrowForm(formData) {
  const errors = {}
  
  // Validate offer token
  if (!formData.offerToken) {
    errors.offerToken = 'Please select a token to offer'
  }
  
  // Validate offer amount
  if (formData.offerToken) {
    const amountValidation = validateAmount(formData.offerAmount, {
      min: 0.000001,
      balance: formData.offerToken.amount
    })
    if (!amountValidation.valid) {
      errors.offerAmount = amountValidation.error
    }
  }
  
  // Validate request token
  if (!formData.requestToken) {
    errors.requestToken = 'Please select a token to request'
  }
  
  // Validate request amount
  const requestAmountValidation = validateAmount(formData.requestAmount, {
    min: 0.000001
  })
  if (!requestAmountValidation.valid) {
    errors.requestAmount = requestAmountValidation.error
  }
  
  // Validate same token
  if (formData.offerToken && formData.requestToken && 
      formData.offerToken.mint === formData.requestToken.mint) {
    errors.tokens = 'Offer and request tokens must be different'
  }
  
  // Validate direct address if enabled
  if (formData.settings?.direct && formData.settings?.directAddress) {
    const addressValidation = validateSolanaAddress(formData.settings.directAddress)
    if (!addressValidation.valid) {
      errors.directAddress = addressValidation.error
    }
  }
  
  // Validate whitelist addresses if enabled
  if (formData.settings?.whitelist && formData.settings?.whitelistAddresses?.length > 0) {
    const listValidation = validateAddressList(formData.settings.whitelistAddresses)
    if (!listValidation.valid) {
      errors.whitelistAddresses = listValidation.errors.join(', ')
    }
  }
  
  // Validate expiration date if enabled
  if (formData.settings?.expire && formData.settings?.expireDate) {
    const dateValidation = validateExpirationDate(formData.settings.expireDate)
    if (!dateValidation.valid) {
      errors.expireDate = dateValidation.error
    }
  }
  
  // Validate slippage
  if (formData.settings?.slippage !== undefined) {
    const slippageValidation = validateSlippage(formData.settings.slippage)
    if (!slippageValidation.valid) {
      errors.slippage = slippageValidation.error
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}
