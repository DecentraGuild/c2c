/**
 * Recipient validation utilities
 * Handles validation of escrow recipients, including SystemProgram checks
 */

import { SystemProgram, PublicKey } from '@solana/web3.js'

/**
 * Check if a recipient is SystemProgram (public escrow)
 * @param {PublicKey|string|null} recipient - Recipient to check
 * @returns {boolean} True if recipient is SystemProgram or null
 */
export function isPublicRecipient(recipient) {
  if (!recipient) return true
  
  const recipientPubkey = recipient instanceof PublicKey 
    ? recipient 
    : new PublicKey(recipient)
  
  return recipientPubkey.equals(SystemProgram.programId)
}

/**
 * Validate recipient address for direct escrows
 * @param {string} recipientAddress - Recipient address string
 * @returns {{valid: boolean, error: string|null, pubkey: PublicKey|null}} Validation result
 */
export function validateRecipientAddress(recipientAddress) {
  if (!recipientAddress || typeof recipientAddress !== 'string') {
    return {
      valid: false,
      error: 'Recipient address is required',
      pubkey: null
    }
  }
  
  const trimmed = recipientAddress.trim()
  
  if (!trimmed) {
    return {
      valid: false,
      error: 'Recipient address cannot be empty',
      pubkey: null
    }
  }
  
  // Check if recipient is SystemProgram (invalid for direct escrows)
  const SYSTEM_PROGRAM_ID_STR = SystemProgram.programId.toString()
  if (trimmed === SYSTEM_PROGRAM_ID_STR || trimmed === '11111111111111111111111111111111') {
    return {
      valid: false,
      error: 'Cannot use SystemProgram (1111...1111) as recipient. Use a valid wallet address or disable Direct mode for public escrows.',
      pubkey: null
    }
  }
  
  // Validate it's a valid Solana address
  try {
    const pubkey = new PublicKey(trimmed)
    
    // Double-check it's not SystemProgram
    if (pubkey.equals(SystemProgram.programId)) {
      return {
        valid: false,
        error: 'Cannot use SystemProgram as recipient. Use a valid wallet address or disable Direct mode for public escrows.',
        pubkey: null
      }
    }
    
    return {
      valid: true,
      error: null,
      pubkey
    }
  } catch (err) {
    return {
      valid: false,
      error: 'Invalid Solana address format',
      pubkey: null
    }
  }
}

/**
 * Check if taker can exchange escrow based on recipient
 * @param {PublicKey|string|null} recipient - Escrow recipient
 * @param {boolean} onlyRecipient - Only recipient flag from escrow
 * @param {PublicKey|string} taker - Taker's public key
 * @returns {{canExchange: boolean, reason: string|null}} Check result
 */
export function canTakerExchange(recipient, onlyRecipient, taker) {
  const takerPubkey = taker instanceof PublicKey ? taker : new PublicKey(taker)
  const isPublic = isPublicRecipient(recipient)
  
  // Public escrows can be filled by anyone
  if (isPublic) {
    return { canExchange: true, reason: null }
  }
  
  // If recipient is set and onlyRecipient is true, taker must match
  if (onlyRecipient && recipient) {
    const recipientPubkey = recipient instanceof PublicKey 
      ? recipient 
      : new PublicKey(recipient)
    
    if (!recipientPubkey.equals(takerPubkey)) {
      return {
        canExchange: false,
        reason: `This escrow can only be filled by: ${recipientPubkey.toString().slice(0, 4)}...${recipientPubkey.toString().slice(-4)}`
      }
    }
  }
  
  return { canExchange: true, reason: null }
}
