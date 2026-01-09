/**
 * Wrapped SOL handling utilities
 * Handles the complex logic for wrapping native SOL for escrow exchanges
 */

import { SystemProgram, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createSyncNativeInstruction, NATIVE_MINT } from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'
import { toBN } from './solanaUtils'

/**
 * Calculate SOL amount needed for wrapped SOL account
 * @param {Object} options - Options object
 * @param {PublicKey} options.wrappedSolAccount - Wrapped SOL account address
 * @param {BN} options.requestAmountLamports - Request amount in lamports
 * @param {boolean} options.accountExists - Whether the account already exists
 * @param {Connection} options.connection - Solana connection
 * @returns {Promise<BN>} SOL amount to transfer (in lamports)
 */
export async function calculateSolToTransfer({ wrappedSolAccount, requestAmountLamports, accountExists, connection }) {
  // Rent-exempt amount for wrapped SOL account (0.00203928 SOL = 2,039,280 lamports)
  const rentExemptAmount = new BN(2039280)
  
  if (!accountExists) {
    // New account: transfer request amount + rent
    // Note: The rent will be returned when the account closes after exchange,
    // which causes the confusing balance display, but this is necessary for account creation
    return requestAmountLamports.add(rentExemptAmount)
  }
  
  // Existing account: check current balance
  try {
    const accountInfo = await connection.getAccountInfo(wrappedSolAccount)
    if (accountInfo) {
      // Account exists, check if it has enough balance
      const tokenAccount = await connection.getParsedAccountInfo(wrappedSolAccount)
      const currentBalance = tokenAccount.value?.data?.parsed?.info?.tokenAmount?.uiAmount || 0
      const currentBalanceLamports = toBN(Math.floor(currentBalance * 1e9))
      
      if (currentBalanceLamports.gte(requestAmountLamports)) {
        // Already has enough, no transfer needed
        return new BN(0)
      } else {
        // Need to add more - only transfer the difference
        return requestAmountLamports.sub(currentBalanceLamports)
      }
    } else {
      // Account doesn't exist (shouldn't happen if accountExists is true, but handle it)
      return requestAmountLamports.add(rentExemptAmount)
    }
  } catch (err) {
    // If we can't check, transfer the full amount (safer)
    console.warn('Could not check wrapped SOL account balance, transferring full amount:', err)
    return requestAmountLamports.add(rentExemptAmount)
  }
}

/**
 * Get request amount in lamports for wrapped SOL
 * @param {Object} options - Options object
 * @param {BN|string|number} options.requestAmount - Request amount (if provided)
 * @param {Function} options.fetchEscrowAccount - Function to fetch escrow account (fallback)
 * @param {BN} options.amountBN - Amount BN (for calculation)
 * @returns {Promise<BN>} Request amount in lamports
 */
export async function getRequestAmountLamports({ requestAmount, fetchEscrowAccount, amountBN }) {
  if (requestAmount) {
    return toBN(requestAmount)
  }
  
  // Fallback: fetch escrow to calculate (less accurate)
  if (fetchEscrowAccount) {
    const escrowAccount = await fetchEscrowAccount()
    const price = escrowAccount.price
    const amount = toBN(amountBN)
    // Estimate: this is approximate without exact decimals
    const priceScaled = new BN(Math.floor(price * 1e9))
    return amount.mul(priceScaled).div(new BN(1e9))
  }
  
  throw new Error('Cannot calculate request amount: neither requestAmount nor fetchEscrowAccount provided')
}

/**
 * Add wrapped SOL instructions to transaction
 * @param {Object} options - Options object
 * @param {Transaction} options.transaction - Transaction to add instructions to
 * @param {PublicKey} options.takerPubkey - Taker's public key
 * @param {PublicKey} options.wrappedSolAccount - Wrapped SOL account address
 * @param {BN} options.solToTransfer - SOL amount to transfer
 * @param {boolean} options.accountExists - Whether the account already exists
 * @returns {void}
 */
export function addWrappedSolInstructions({ transaction, takerPubkey, wrappedSolAccount, solToTransfer, accountExists }) {
  // Only add transfer instruction if we need to transfer SOL
  if (solToTransfer.gt(new BN(0))) {
    // Transfer SOL from user's wallet to wrapped SOL account
    // This must happen BEFORE the exchange instruction
    const transferSolIx = SystemProgram.transfer({
      fromPubkey: takerPubkey,
      toPubkey: wrappedSolAccount,
      lamports: solToTransfer.toNumber()
    })
    transaction.add(transferSolIx)
  }
  
  // Sync native SOL to wrapped SOL
  // This converts the native SOL in the account to wrapped SOL tokens
  // Only needed if we transferred SOL or if account might have native SOL
  if (!accountExists || solToTransfer.gt(new BN(0))) {
    const syncNativeIx = createSyncNativeInstruction(
      wrappedSolAccount,
      TOKEN_PROGRAM_ID
    )
    transaction.add(syncNativeIx)
  }
}

/**
 * Check if a token mint is wrapped SOL
 * @param {PublicKey|string} mint - Token mint address
 * @returns {boolean} True if mint is wrapped SOL
 */
export function isWrappedSol(mint) {
  const mintPubkey = mint instanceof PublicKey ? mint : new PublicKey(mint)
  return mintPubkey.equals(NATIVE_MINT)
}

/**
 * Get wrapped SOL account address for a taker
 * @param {PublicKey|string} taker - Taker's public key
 * @returns {PublicKey} Wrapped SOL account address
 */
export function getWrappedSolAccount(taker) {
  const takerPubkey = taker instanceof PublicKey ? taker : new PublicKey(taker)
  return getAssociatedTokenAddressSync(
    NATIVE_MINT,
    takerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
}
