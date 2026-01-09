/**
 * Debounce composable with consistent defaults
 * Provides debounced functions with common delay values
 */

import { ref } from 'vue'
import { debounce as debounceUtil } from '../utils/debounce'

/**
 * Common debounce delays (in milliseconds)
 */
export const DEBOUNCE_DELAYS = {
  SHORT: 150,
  MEDIUM: 300,
  LONG: 500,
  DEFAULT: 300
}

/**
 * Create a debounced function with default delay
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Function} Debounced function
 */
export function useDebounce(fn, delay = DEBOUNCE_DELAYS.DEFAULT) {
  return debounceUtil(fn, delay)
}

/**
 * Composable for debounced operations
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Object} Debounced function and control methods
 */
export function useDebouncedFunction(fn, delay = DEBOUNCE_DELAYS.DEFAULT) {
  const debouncedFn = debounceUtil(fn, delay)
  
  return {
    debouncedFn,
    delay
  }
}
