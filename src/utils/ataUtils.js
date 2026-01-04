/**
 * ATA (Associated Token Account) Utilities
 * Functions to check and create associated token accounts
 */

import { 
  getAccount,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import { 
  Connection, 
  PublicKey 
} from '@solana/web3.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'

/**
 * Check if an ATA exists
 * @param {PublicKey|string} mint - Token mint address
 * @param {PublicKey|string} owner - Owner's public key
 * @param {Connection} connection - Solana connection
 * @returns {Promise<boolean>} True if ATA exists, false otherwise
 */
export async function checkAtaExists(mint, owner, connection) {
  try {
    const mintPubkey = mint instanceof PublicKey ? mint : new PublicKey(mint)
    const ownerPubkey = owner instanceof PublicKey ? owner : new PublicKey(owner)
    
    const ata = getAssociatedTokenAddressSync(
      mintPubkey,
      ownerPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    
    await getAccount(connection, ata)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Create instruction to create an ATA if it doesn't exist
 * @param {PublicKey|string} mint - Token mint address
 * @param {PublicKey|string} owner - Owner's public key
 * @param {PublicKey|string} [payer] - Payer's public key (defaults to owner)
 * @returns {TransactionInstruction} Instruction to create ATA
 */
export function makeAtaInstruction(mint, owner, payer = null) {
  const mintPubkey = mint instanceof PublicKey ? mint : new PublicKey(mint)
  const ownerPubkey = owner instanceof PublicKey ? owner : new PublicKey(owner)
  const payerPubkey = payer 
    ? (payer instanceof PublicKey ? payer : new PublicKey(payer))
    : ownerPubkey
  
  const ata = getAssociatedTokenAddressSync(
    mintPubkey,
    ownerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  return createAssociatedTokenAccountInstruction(
    payerPubkey,
    ata,
    ownerPubkey,
    mintPubkey,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
}
