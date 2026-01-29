/**
 * Centralized logging utility
 * Provides consistent logging with environment-aware behavior
 * Supports toggled debug mode for bug fixing
 */

const isDev = import.meta.env.DEV

// Debug mode can be toggled via window.debugLogging = true
// Useful for debugging in production without rebuilding
let debugMode = false

// Expose debug toggle to window for runtime control
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'debugLogging', {
    get: () => debugMode,
    set: (value) => {
      debugMode = !!value
      console.log(`[Logger] Debug mode ${debugMode ? 'enabled' : 'disabled'}`)
    },
    configurable: true
  })
}

/**
 * Check if debug logging should be enabled
 */
function shouldLogDebug() {
  return isDev || debugMode
}

/**
 * Log debug information (dev only, or when debug mode is enabled)
 * For NFT fetching, we always log to help with debugging
 */
export function logDebug(...args) {
  // Always log if it's about NFT fetching (helps debug collection issues)
  const isNFTFetching = args[0] && typeof args[0] === 'string' && (
    args[0].includes('NFT') || 
    args[0].includes('collection') || 
    args[0].includes('Helius') ||
    args[0].includes('useWalletNFTs') ||
    args[0].includes('useCollectionNFTs')
  )
  
  if (shouldLogDebug() || isNFTFetching) {
    console.log('[DEBUG]', ...args)
  }
}

/**
 * Log warning (dev only, or when debug mode is enabled)
 */
export function logWarning(...args) {
  if (shouldLogDebug()) {
    console.warn(...args)
  }
  // In production, you could send to error tracking service
}

/**
 * Log error (always logged, but can be enhanced with error tracking)
 */
export function logError(...args) {
  console.error(...args)
  // In production, you could send to error tracking service (Sentry, etc.)
}

/**
 * Log info (dev only, or when debug mode is enabled)
 */
export function logInfo(...args) {
  if (shouldLogDebug()) {
    console.log(...args)
  }
}
