/**
 * Solana utility functions
 * Provides safe conversion and helper functions for Solana types
 */

import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'

/**
 * Safely convert a value to PublicKey
 * @param {PublicKey|string} value - Value to convert
 * @param {string} errorMessage - Custom error message (optional)
 * @returns {PublicKey} PublicKey instance
 * @throws {Error} If conversion fails
 */
export function toPublicKey(value, errorMessage = 'Invalid PublicKey') {
  if (value instanceof PublicKey) {
    return value
  }
  
  if (!value || typeof value !== 'string') {
    throw new Error(errorMessage)
  }
  
  try {
    return new PublicKey(value)
  } catch (err) {
    throw new Error(`${errorMessage}: ${err.message}`)
  }
}

/**
 * Safely convert a value to BN (BigNumber)
 * @param {BN|string|number|bigint|Uint8Array|Array} value - Value to convert
 * @param {string} errorMessage - Custom error message (optional)
 * @returns {BN} BN instance
 * @throws {Error} If conversion fails
 */
export function toBN(value, errorMessage = 'Invalid BN value') {
  if (value instanceof BN) {
    return value
  }
  
  if (value === null || value === undefined) {
    throw new Error(errorMessage)
  }
  
  try {
    // Handle Uint8Array or Array directly (for random bytes seed generation)
    // This matches the original implementation: new BN(randomBytes)
    if (value instanceof Uint8Array || Array.isArray(value)) {
      return new BN(value)
    }
    
    if (typeof value === 'bigint') {
      // Convert bigint to string first
      return new BN(value.toString())
    }
    
    return new BN(value.toString())
  } catch (err) {
    throw new Error(`${errorMessage}: ${err.message}`)
  }
}

/**
 * Convert PublicKey to string safely
 * @param {PublicKey|string|null} value - Value to convert
 * @returns {string|null} String representation or null
 */
export function publicKeyToString(value) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value instanceof PublicKey) return value.toString()
  return null
}
