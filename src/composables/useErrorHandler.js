/**
 * Error Handler Composable
 * Provides centralized error handling with consistent patterns
 * Handles error logging, user notifications, and error state management
 */

import { ref } from 'vue'
import { logError, logWarning } from '../utils/logger'
import { useToast } from './useToast'

/**
 * Error types for categorization
 */
export const ErrorType = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  TRANSACTION: 'transaction',
  BLOCKCHAIN: 'blockchain',
  AUTHENTICATION: 'authentication',
  UNKNOWN: 'unknown'
}

/**
 * Composable for consistent error handling
 * @param {Object} options - Configuration options
 * @param {boolean} options.showToast - Whether to show toast notifications (default: true)
 * @param {boolean} options.logErrors - Whether to log errors to console (default: true)
 * @returns {Object} Error handling utilities
 */
export function useErrorHandler(options = {}) {
  const { showToast = true, logErrors = true } = options
  
  const toast = showToast ? useToast() : null
  const error = ref(null)
  const errorType = ref(null)
  
  /**
   * Determine error type from error object
   * @param {Error|string|Object} err - Error to categorize
   * @returns {string} Error type
   */
  const categorizeError = (err) => {
    if (!err) return ErrorType.UNKNOWN
    
    const errorMessage = typeof err === 'string' ? err : err.message || err.toString()
    const lowerMessage = errorMessage.toLowerCase()
    
    // Network errors
    if (lowerMessage.includes('network') || 
        lowerMessage.includes('fetch') || 
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('connection')) {
      return ErrorType.NETWORK
    }
    
    // Blockchain/RPC errors
    if (lowerMessage.includes('rpc') || 
        lowerMessage.includes('solana') || 
        lowerMessage.includes('transaction') ||
        lowerMessage.includes('blockhash') ||
        lowerMessage.includes('signature')) {
      return ErrorType.BLOCKCHAIN
    }
    
    // Validation errors
    if (lowerMessage.includes('invalid') || 
        lowerMessage.includes('required') || 
        lowerMessage.includes('validation')) {
      return ErrorType.VALIDATION
    }
    
    // Authentication errors
    if (lowerMessage.includes('wallet') || 
        lowerMessage.includes('not connected') || 
        lowerMessage.includes('unauthorized')) {
      return ErrorType.AUTHENTICATION
    }
    
    return ErrorType.UNKNOWN
  }
  
  /**
   * Get user-friendly error message
   * @param {Error|string|Object} err - Error to format
   * @param {string} context - Context where error occurred
   * @returns {string} User-friendly message
   */
  const getUserMessage = (err, context = '') => {
    const type = categorizeError(err)
    const contextPrefix = context ? `${context}: ` : ''
    
    switch (type) {
      case ErrorType.NETWORK:
        return `${contextPrefix}Network error. Please check your connection and try again.`
      
      case ErrorType.BLOCKCHAIN:
        return `${contextPrefix}Blockchain error. Please try again or refresh the page.`
      
      case ErrorType.VALIDATION:
        return `${contextPrefix}${typeof err === 'string' ? err : err.message || 'Validation error'}`
      
      case ErrorType.AUTHENTICATION:
        return `${contextPrefix}Please connect your wallet to continue.`
      
      case ErrorType.TRANSACTION:
        return `${contextPrefix}Transaction failed. Please try again.`
      
      default:
        return `${contextPrefix}${typeof err === 'string' ? err : err.message || 'An unexpected error occurred'}`
    }
  }
  
  /**
   * Handle error with consistent pattern
   * @param {Error|string|Object} err - Error to handle
   * @param {Object} options - Handler options
   * @param {string} options.context - Context where error occurred (e.g., "Loading escrows")
   * @param {boolean} options.silent - Skip toast notification
   * @param {boolean} options.skipLog - Skip console logging
   * @param {string} options.toastMessage - Custom toast message (overrides default)
   * @returns {void}
   */
  const handleError = (err, handlerOptions = {}) => {
    const {
      context = '',
      silent = false,
      skipLog = false,
      toastMessage = null
    } = handlerOptions
    
    // Set error state
    error.value = err
    errorType.value = categorizeError(err)
    
    // Log error
    if (logErrors && !skipLog) {
      const logMessage = context ? `[${context}]` : ''
      logError(logMessage, err)
    }
    
    // Show toast notification
    if (showToast && toast && !silent) {
      const message = toastMessage || getUserMessage(err, context)
      toast.error(message)
    }
  }
  
  /**
   * Handle async operation with automatic error handling
   * @param {Function} operation - Async function to execute
   * @param {Object} options - Handler options
   * @returns {Promise<any>} Result of operation or null if error
   */
  const handleAsync = async (operation, handlerOptions = {}) => {
    try {
      clearError()
      return await operation()
    } catch (err) {
      handleError(err, handlerOptions)
      return null
    }
  }
  
  /**
   * Handle validation errors
   * @param {Object} validationErrors - Object with field -> error message mapping
   * @param {string} context - Context for error message
   * @returns {void}
   */
  const handleValidationErrors = (validationErrors, context = 'Form validation') => {
    if (!validationErrors || Object.keys(validationErrors).length === 0) {
      return
    }
    
    error.value = validationErrors
    errorType.value = ErrorType.VALIDATION
    
    // Show first validation error in toast
    if (showToast && toast) {
      const firstError = Object.values(validationErrors)[0]
      toast.error(`${context}: ${firstError}`)
    }
    
    if (logErrors) {
      logWarning(`[${context}]`, validationErrors)
    }
  }
  
  /**
   * Clear error state
   * @returns {void}
   */
  const clearError = () => {
    error.value = null
    errorType.value = null
  }
  
  /**
   * Check if there's an active error
   * @returns {boolean}
   */
  const hasError = () => {
    return error.value !== null
  }
  
  /**
   * Check if error is of specific type
   * @param {string} type - Error type to check
   * @returns {boolean}
   */
  const isErrorType = (type) => {
    return errorType.value === type
  }
  
  return {
    // State
    error,
    errorType,
    
    // Methods
    handleError,
    handleAsync,
    handleValidationErrors,
    clearError,
    hasError,
    isErrorType,
    
    // Utilities
    categorizeError,
    getUserMessage,
    
    // Error type constants
    ErrorType
  }
}
