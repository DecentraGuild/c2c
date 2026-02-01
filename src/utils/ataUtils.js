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
 * @param {PublicKey} [tokenProgramId=TOKEN_PROGRAM_ID] - Token program (legacy SPL or Token-2022)
 * @returns {Promise<boolean>} True if ATA exists, false otherwise
 */
export async function checkAtaExists(mint, owner, connection, tokenProgramId = TOKEN_PROGRAM_ID) {
  try {
    const mintPubkey = mint instanceof PublicKey ? mint : new PublicKey(mint)
    const ownerPubkey = owner instanceof PublicKey ? owner : new PublicKey(owner)

    const ata = getAssociatedTokenAddressSync(
      mintPubkey,
      ownerPubkey,
      false,
      tokenProgramId,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )

    await getAccount(connection, ata, 'confirmed', tokenProgramId)
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
 * @param {PublicKey} [tokenProgramId=TOKEN_PROGRAM_ID] - Token program (legacy SPL or Token-2022)
 * @returns {TransactionInstruction} Instruction to create ATA
 */
export function makeAtaInstruction(mint, owner, payer = null, tokenProgramId = TOKEN_PROGRAM_ID) {
  const mintPubkey = mint instanceof PublicKey ? mint : new PublicKey(mint)
  const ownerPubkey = owner instanceof PublicKey ? owner : new PublicKey(owner)
  const payerPubkey = payer
    ? (payer instanceof PublicKey ? payer : new PublicKey(payer))
    : ownerPubkey

  const ata = getAssociatedTokenAddressSync(
    mintPubkey,
    ownerPubkey,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )

  return createAssociatedTokenAccountInstruction(
    payerPubkey,
    ata,
    ownerPubkey,
    mintPubkey,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
}
