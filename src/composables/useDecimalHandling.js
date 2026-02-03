/**
 * Composable for handling decimal-related utilities
 * Provides functions for calculating input steps and placeholders based on token decimals
 */

import { DECIMAL_CONSTANTS } from '@/utils/constants/ui'

/**
 * Get the step value for a number input based on token decimals
 * @param {number} decimals - Number of decimal places for the token
 * @returns {string} Step value for input element
 */
export function getStepForDecimals(decimals) {
  // For tokens with 0 decimals, use step of 1 (whole numbers only)
  if (decimals === 0) {
    return '1'
  }
  if (!decimals || decimals === DECIMAL_CONSTANTS.MIN_DECIMALS) {
    return DECIMAL_CONSTANTS.STEP_VALUES.TWO
  }
  // For tokens with many decimals, use a reasonable step
  // Cap at MAX_STEP_DECIMALS to avoid precision issues
  const displayDecimals = Math.min(decimals, DECIMAL_CONSTANTS.MAX_STEP_DECIMALS)
  // Create step string manually to avoid precision issues
  const { STEP_THRESHOLDS, STEP_VALUES } = DECIMAL_CONSTANTS
  if (displayDecimals <= STEP_THRESHOLDS.TWO) return STEP_VALUES.TWO
  if (displayDecimals <= STEP_THRESHOLDS.FOUR) return STEP_VALUES.FOUR
  if (displayDecimals <= STEP_THRESHOLDS.SIX) return STEP_VALUES.SIX
  if (displayDecimals <= STEP_THRESHOLDS.EIGHT) return STEP_VALUES.EIGHT
  return STEP_VALUES.NINE
}

/**
 * Get the placeholder value for a number input based on token decimals
 * @param {number} decimals - Number of decimal places for the token
 * @returns {string} Placeholder value for input element
 */
export function getPlaceholderForDecimals(decimals) {
  // For tokens with 0 decimals, show whole number placeholder
  if (decimals === 0) {
    return '0'
  }
  if (!decimals || decimals === DECIMAL_CONSTANTS.MIN_DECIMALS) {
    return `${DECIMAL_CONSTANTS.MIN_DECIMALS}.${'0'.repeat(DECIMAL_CONSTANTS.DEFAULT_DECIMALS)}`
  }
  // Show placeholder with appropriate decimal places (max MAX_DISPLAY_DECIMALS for readability)
  const displayDecimals = Math.min(decimals, DECIMAL_CONSTANTS.MAX_DISPLAY_DECIMALS)
  return `0.${'0'.repeat(displayDecimals)}`
}

/**
 * Composable for decimal handling utilities
 * @returns {Object} Decimal handling functions
 */
export function useDecimalHandling() {
  return {
    getStepForDecimals,
    getPlaceholderForDecimals
  }
}
