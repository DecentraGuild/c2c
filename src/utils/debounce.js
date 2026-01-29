/**
 * Debounce Utility
 * Delays function execution until after a specified wait time has passed
 * since the last time it was invoked. Useful for expensive operations like
 * API calls, calculations, or DOM updates.
 * 
 * Example: User types in search box -> debounce waits 300ms after they stop typing
 * before executing the search, instead of searching on every keystroke.
 * 
 * @module utils/debounce
 */

import { DEBOUNCE_DELAYS } from './constants/ui.js'

// Re-export constants for convenience
export { DEBOUNCE_DELAYS }

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Optional configuration
 * @param {boolean} options.leading - Invoke on the leading edge of the timeout
 * @param {boolean} options.trailing - Invoke on the trailing edge of the timeout (default: true)
 * @returns {Function} The debounced function
 */
export function debounce(func, wait = DEBOUNCE_DELAYS.DEFAULT, options = {}) {
  let timeoutId = null
  let lastCallTime = null
  let lastInvokeTime = 0
  let maxWait = null
  let leading = false
  let trailing = true
  let result

  // Parse options
  if (typeof options === 'object') {
    leading = !!options.leading
    trailing = options.trailing !== false
    maxWait = 'maxWait' in options ? options.maxWait : null
  }

  function invokeFunc(time) {
    const args = lastCallTime ? [lastCallTime] : []
    lastInvokeTime = time
    result = func.apply(this, args)
    return result
  }

  function leadingEdge(time) {
    lastInvokeTime = time
    timeoutId = setTimeout(timerExpired, wait)
    return leading ? invokeFunc(time) : result
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall

    return maxWait !== null
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== null && timeSinceLastInvoke >= maxWait)
    )
  }

  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time))
  }

  function trailingEdge(time) {
    timeoutId = null
    return trailing ? invokeFunc(time) : result
  }

  function cancel() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    lastInvokeTime = 0
    lastCallTime = null
    timeoutId = null
  }

  function flush() {
    return timeoutId === null ? result : trailingEdge(Date.now())
  }

  function pending() {
    return timeoutId !== null
  }

  function debounced(...args) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastCallTime = time

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(time)
      }
      if (maxWait !== null) {
        timeoutId = setTimeout(timerExpired, wait)
        return invokeFunc(time)
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, wait)
    }
    return result
  }

  debounced.cancel = cancel
  debounced.flush = flush
  debounced.pending = pending

  return debounced
}

/**
 * Simple debounce function (easier to use, less features)
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function simpleDebounce(func, wait = DEBOUNCE_DELAYS.DEFAULT) {
  let timeoutId = null

  function debounced(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debounced
}
