/**
 * Transaction builder helper functions
 * Breaks down complex transaction building into smaller, reusable functions
 */

import { Transaction } from '@solana/web3.js'
import { 
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { checkAtaExists, makeAtaInstruction } from './ataUtils'
import { TRANSACTION_COSTS } from './constants/fees'
import { toPublicKey } from './solanaUtils'

/**
 * Get all ATAs needed for exchange transaction
 * @param {Object} options - Options object
 * @param {PublicKey|string} options.maker - Maker's public key
 * @param {PublicKey|string} options.taker - Taker's public key
 * @param {PublicKey|string} options.depositTokenMint - Deposit token mint
 * @param {PublicKey|string} options.requestTokenMint - Request token mint
 * @returns {Object} All ATA addresses
 */
export function getExchangeATAs({ maker, taker, depositTokenMint, requestTokenMint }) {
  const makerPubkey = toPublicKey(maker)
  const takerPubkey = toPublicKey(taker)
  const depositTokenPubkey = toPublicKey(depositTokenMint)
  const requestTokenPubkey = toPublicKey(requestTokenMint)

  return {
    makerReceiveAta: getAssociatedTokenAddressSync(
      requestTokenPubkey,
      makerPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    ),
    takerAta: getAssociatedTokenAddressSync(
      requestTokenPubkey,
      takerPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    ),
    takerReceiveAta: getAssociatedTokenAddressSync(
      depositTokenPubkey,
      takerPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  }
}

/**
 * Add ATA creation instructions if needed
 * @param {Object} options - Options object
 * @param {Transaction} options.transaction - Transaction to add instructions to
 * @param {PublicKey} options.tokenMint - Token mint address
 * @param {PublicKey} options.owner - Account owner
 * @param {boolean} options.ataExists - Whether ATA already exists
 * @returns {number} Cost incurred (0 if ATA exists, ATA_CREATION otherwise)
 */
export function addAtaIfNeeded({ transaction, tokenMint, owner, ataExists }) {
  if (!ataExists) {
    transaction.add(makeAtaInstruction(tokenMint, owner, owner))
    return TRANSACTION_COSTS.ATA_CREATION
  }
  return 0
}

/**
 * Prepare ATA accounts for exchange
 * Checks existence and adds creation instructions if needed
 * @param {Object} options - Options object
 * @param {Transaction} options.transaction - Transaction to add instructions to
 * @param {PublicKey} options.requestTokenMint - Request token mint
 * @param {PublicKey} options.depositTokenMint - Deposit token mint
 * @param {PublicKey} options.taker - Taker's public key
 * @param {Connection} options.connection - Solana connection
 * @returns {Promise<{takerAtaExists: boolean, takerReceiveAtaExists: boolean, totalCost: number}>}
 */
export async function prepareTakerATAs({ transaction, requestTokenMint, depositTokenMint, taker, connection }) {
  const requestTokenPubkey = toPublicKey(requestTokenMint)
  const depositTokenPubkey = toPublicKey(depositTokenMint)
  const takerPubkey = toPublicKey(taker)

  // Check if ATAs exist
  const takerAtaExists = await checkAtaExists(requestTokenPubkey, takerPubkey, connection)
  const takerReceiveAtaExists = await checkAtaExists(depositTokenPubkey, takerPubkey, connection)

  // Add ATA creation instructions if needed
  let totalCost = 0
  totalCost += addAtaIfNeeded({
    transaction,
    tokenMint: requestTokenPubkey,
    owner: takerPubkey,
    ataExists: takerAtaExists
  })
  totalCost += addAtaIfNeeded({
    transaction,
    tokenMint: depositTokenPubkey,
    owner: takerPubkey,
    ataExists: takerReceiveAtaExists
  })

  return {
    takerAtaExists,
    takerReceiveAtaExists,
    totalCost
  }
}
