/**
 * Input handling utilities for token amounts
 * Handles validation and formatting for both 0-decimal and decimal tokens
 */

/**
 * Process input value for 0-decimal tokens (removes decimals, ensures integer)
 * @param {string} amountValue - Raw input value
 * @param {HTMLInputElement|null} inputElement - Input element to update (optional)
 * @returns {string} Processed value (integer string)
 */
export function processZeroDecimalInput(amountValue, inputElement = null) {
  let processed = amountValue
  
  // Remove decimal point and everything after it
  if (processed.includes('.')) {
    processed = processed.split('.')[0]
    if (inputElement) {
      const cursorPos = inputElement.selectionStart
      inputElement.value = processed
      const newPos = Math.min(cursorPos - 1, processed.length)
      setTimeout(() => {
        inputElement.setSelectionRange(newPos, newPos)
      }, 0)
    }
  }
  
  // Ensure it's a valid integer
  const numValue = parseFloat(processed)
  if (!isNaN(numValue)) {
    const intValue = Math.floor(Math.abs(numValue)).toString()
    if (intValue !== processed) {
      processed = intValue
      if (inputElement) {
        inputElement.value = processed
      }
    }
  }
  
  return processed
}

/**
 * Process input value for decimal tokens (validates format, ensures single decimal point)
 * @param {string} amountValue - Raw input value
 * @param {HTMLInputElement|null} inputElement - Input element to update (optional)
 * @returns {string} Processed value
 */
export function processDecimalInput(amountValue, inputElement = null) {
  let processed = amountValue
  
  // Validate the format - allow: numbers, single decimal point, digits
  const validPattern = /^[0-9]*\.?[0-9]*$/
  if (!validPattern.test(processed)) {
    // Remove invalid characters
    processed = processed.replace(/[^0-9.]/g, '')
    // Ensure only one decimal point
    const parts = processed.split('.')
    if (parts.length > 2) {
      processed = parts[0] + '.' + parts.slice(1).join('')
    }
    if (inputElement) {
      const cursorPos = inputElement.selectionStart
      inputElement.value = processed
      setTimeout(() => {
        inputElement.setSelectionRange(cursorPos, cursorPos)
      }, 0)
    }
  }
  
  return processed
}

/**
 * Process amount input based on token decimals
 * @param {string} rawValue - Raw input value
 * @param {number} decimals - Token decimals (0 for whole numbers)
 * @param {HTMLInputElement|null} inputElement - Input element to update (optional)
 * @returns {string} Processed value
 */
export function processAmountInput(rawValue, decimals, inputElement = null) {
  if (decimals === 0) {
    return processZeroDecimalInput(rawValue, inputElement)
  } else {
    return processDecimalInput(rawValue, inputElement)
  }
}

/**
 * Validate keydown event for token input
 * @param {KeyboardEvent} event - Keydown event
 * @param {number} decimals - Token decimals (0 for whole numbers)
 * @returns {boolean} True if key should be prevented
 */
export function shouldPreventKeydown(event, decimals) {
  if (decimals === 0) {
    // For 0-decimal tokens, prevent decimal point and invalid characters
    if (event.key === '.' || event.key === ',' || event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
      return true
    }
  } else {
    // For tokens with decimals, allow decimal point but prevent multiple
    if (event.key === '.' && event.target.value.includes('.')) {
      return true
    }
    // Prevent scientific notation and other invalid characters
    if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
      return true
    }
  }
  return false
}
