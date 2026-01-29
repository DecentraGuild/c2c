/**
 * Unified Error Handler
 * Centralized error handling, parsing, and formatting
 * Consolidates errorParser.js, errorMessages.js, and error display logic
 */

import { parseAnchorError, parseNetworkError, parseWalletError, getUserFriendlyError as getUserFriendlyErrorParser, isRetryableError } from './errorParser'
import { formatErrorMessage, formatUserFriendlyError } from './errorMessages'

/**
 * Error types enum
 */
export const ERROR_TYPES = {
  TRANSACTION: 'transaction',
  FORM: 'form',
  NETWORK: 'network',
  WALLET: 'wallet',
  ESCROWS: 'escrows',
  VALIDATION: 'validation'
}

/**
 * Unified error handler class
 * Provides consistent error handling across the application
 */
export class ErrorHandler {
  /**
   * Parse and format an error into a user-friendly message
   * @param {Error|string|Object} error - Error to handle
   * @param {Object} options - Options
   * @param {string} options.context - Context of the error (e.g., 'create escrow')
   * @param {string} options.defaultMessage - Default message if parsing fails
   * @param {boolean} options.useParser - Whether to use error parser (default: true)
   * @returns {string} User-friendly error message
   */
  static formatError(error, options = {}) {
    const { context = '', defaultMessage = 'An unexpected error occurred. Please try again.', useParser = true } = options

    if (!error) {
      return defaultMessage
    }

    // Use error parser for detailed parsing (Anchor, network, wallet errors)
    if (useParser) {
      const parsedError = getUserFriendlyErrorParser(error, defaultMessage)
      if (parsedError !== defaultMessage) {
        return parsedError
      }
    }

    // Fall back to formatter for general errors
    return formatUserFriendlyError(error, context)
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   */
  static isRetryable(error) {
    return isRetryableError(error)
  }

  /**
   * Get error type from error object
   * @param {Error} error - Error to analyze
   * @returns {string} Error type (ERROR_TYPES)
   */
  static getErrorType(error) {
    if (!error) return ERROR_TYPES.NETWORK

    const errorMessage = (error.message || error.toString()).toLowerCase()

    if (parseAnchorError(error)) {
      return ERROR_TYPES.TRANSACTION
    }

    if (parseWalletError(error)) {
      return ERROR_TYPES.WALLET
    }

    if (parseNetworkError(error)) {
      return ERROR_TYPES.NETWORK
    }

    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return ERROR_TYPES.VALIDATION
    }

    return ERROR_TYPES.TRANSACTION
  }

  /**
   * Create error object with type and formatted message
   * @param {Error|string|Object} error - Error to handle
   * @param {Object} options - Options
   * @returns {Object} Error object with type and message
   */
  static createError(error, options = {}) {
    const message = this.formatError(error, options)
    const type = this.getErrorType(error)
    const retryable = this.isRetryable(error)

    return {
      type,
      message,
      retryable,
      original: error
    }
  }
}

/**
 * Convenience function for formatting errors
 * @param {Error|string|Object} error - Error to format
 * @param {string} context - Context of the error
 * @param {string} defaultMessage - Default message
 * @returns {string} Formatted error message
 */
export function formatError(error, context = '', defaultMessage = 'An unexpected error occurred. Please try again.') {
  return ErrorHandler.formatError(error, { context, defaultMessage })
}

/**
 * Convenience function for checking if error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} True if retryable
 */
export function isErrorRetryable(error) {
  return ErrorHandler.isRetryable(error)
}

/**
 * Convenience function for getting error type
 * @param {Error} error - Error to analyze
 * @returns {string} Error type
 */
export function getErrorType(error) {
  return ErrorHandler.getErrorType(error)
}

// Re-export parser functions for backward compatibility
export { parseAnchorError, parseNetworkError, parseWalletError, getUserFriendlyErrorParser as getUserFriendlyError, isRetryableError }
