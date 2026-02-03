/**
 * Debounce Composable
 * Provides Vue-compatible debounced functions with reactive cleanup
 * 
 * For simple debouncing, use the utility directly: `import { debounce } from '@/utils/debounce'`
 * Use this composable when you need Vue lifecycle-aware debouncing with automatic cleanup
 * 
 * @module composables/useDebounce
 */

import { onUnmounted } from 'vue'
import { debounce, DEBOUNCE_DELAYS } from '@/utils/debounce'

/**
 * Create a debounced function that is automatically cancelled on component unmount
 * 
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Function} Debounced function with cancel capability
 * 
 * @example
 * ```js
 * const debouncedSearch = useDebounce((query) => {
 *   searchTokens(query)
 * }, DEBOUNCE_DELAYS.MEDIUM)
 * 
 * // Use in template or script
 * debouncedSearch('solana')
 * ```
 */
export function useDebounce(fn, delay = DEBOUNCE_DELAYS.DEFAULT) {
  const debouncedFn = debounce(fn, delay)
  
  // Automatically cancel on unmount to prevent memory leaks
  onUnmounted(() => {
    if (debouncedFn.cancel) {
      debouncedFn.cancel()
    }
  })
  
  return debouncedFn
}

// Re-export constants for convenience
export { DEBOUNCE_DELAYS }
