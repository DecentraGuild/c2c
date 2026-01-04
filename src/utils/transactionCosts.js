/**
 * Transaction Cost Calculator
 * Calculates the total SOL cost for escrow transactions including ATA creation costs
 */

import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { checkAtaExists } from './ataUtils'
import { TRANSACTION_COSTS, FEE_CONFIG } from './constants/fees'

/**
 * Calculate transaction costs for creating an escrow
 * @param {Object} params - Cost calculation parameters
 * @param {PublicKey|string} params.maker - Maker's public key
 * @param {PublicKey|string} params.depositTokenMint - Deposit token mint address
 * @param {PublicKey|string} params.requestTokenMint - Request token mint address
 * @param {Connection} params.connection - Solana connection
 * @returns {Promise<Object>} Cost breakdown object
 */
export async function calculateEscrowCreationCosts({
  maker,
  depositTokenMint,
  requestTokenMint,
  connection
}) {
  const makerPubkey = maker instanceof PublicKey ? maker : new PublicKey(maker)
  const depositTokenPubkey = new PublicKey(depositTokenMint)
  const requestTokenPubkey = new PublicKey(requestTokenMint)

  // Check if ATAs exist
  const depositAtaExists = await checkAtaExists(depositTokenPubkey, makerPubkey, connection)
  const requestAtaExists = await checkAtaExists(requestTokenPubkey, makerPubkey, connection)

  // Calculate costs
  const escrowRent = TRANSACTION_COSTS.ESCROW_RENT
  const contractFee = TRANSACTION_COSTS.CONTRACT_FEE
  const platformFee = TRANSACTION_COSTS.PLATFORM_FEE
  const depositAtaCost = depositAtaExists ? 0 : TRANSACTION_COSTS.ATA_CREATION
  const requestAtaCost = requestAtaExists ? 0 : TRANSACTION_COSTS.ATA_CREATION

  const totalCost = escrowRent + contractFee + platformFee + depositAtaCost + requestAtaCost

  return {
    escrowRent,
    contractFee,
    platformFee,
    depositAtaCost,
    requestAtaCost,
    depositAtaExists,
    requestAtaExists,
    totalCost,
    breakdown: {
      recoverable: escrowRent + depositAtaCost + requestAtaCost,
      nonRecoverable: contractFee + platformFee
    }
  }
}

/**
 * Format cost breakdown for display
 * @param {Object} costs - Cost breakdown from calculateEscrowCreationCosts
 * @returns {Object} Formatted cost breakdown
 */
export function formatCostBreakdown(costs) {
  const items = []
  
  // Escrow rent (always present)
  items.push({
    label: 'Escrow accounts (recoverable)',
    amount: costs.escrowRent,
    recoverable: true
  })

  // Deposit ATA cost (if needed)
  if (costs.depositAtaCost > 0) {
    items.push({
      label: 'Deposit token account (recoverable)',
      amount: costs.depositAtaCost,
      recoverable: true
    })
  }

  // Request ATA cost (if needed)
  if (costs.requestAtaCost > 0) {
    items.push({
      label: 'Request token account (recoverable)',
      amount: costs.requestAtaCost,
      recoverable: true
    })
  }

  // Contract fee (always present)
  items.push({
    label: 'Contract fee',
    amount: costs.contractFee,
    recoverable: false
  })

  // Platform fee (always present)
  items.push({
    label: 'Platform fee (per contract trigger)',
    amount: costs.platformFee,
    recoverable: false
  })

  return {
    items,
    total: costs.totalCost,
    recoverable: costs.breakdown.recoverable,
    nonRecoverable: costs.breakdown.nonRecoverable
  }
}

/**
 * Calculate transaction costs for filling/exchanging an escrow
 * @param {Object} params - Cost calculation parameters
 * @param {PublicKey|string} params.taker - Taker's public key
 * @param {PublicKey|string} params.depositTokenMint - Deposit token mint address
 * @param {PublicKey|string} params.requestTokenMint - Request token mint address
 * @param {Connection} params.connection - Solana connection
 * @returns {Promise<Object>} Cost breakdown object
 */
export async function calculateExchangeCosts({
  taker,
  depositTokenMint,
  requestTokenMint,
  connection
}) {
  const takerPubkey = taker instanceof PublicKey ? taker : new PublicKey(taker)
  const depositTokenPubkey = new PublicKey(depositTokenMint)
  const requestTokenPubkey = new PublicKey(requestTokenMint)

  // Check if ATAs exist
  const takerAtaExists = await checkAtaExists(requestTokenPubkey, takerPubkey, connection)
  const takerReceiveAtaExists = await checkAtaExists(depositTokenPubkey, takerPubkey, connection)

  // Calculate costs
  const transactionFee = TRANSACTION_COSTS.TRANSACTION_FEE
  const contractFee = TRANSACTION_COSTS.CONTRACT_FEE // Contract charges this, but it's paid by the contract logic
  const takerAtaCost = takerAtaExists ? 0 : TRANSACTION_COSTS.ATA_CREATION
  const takerReceiveAtaCost = takerReceiveAtaExists ? 0 : TRANSACTION_COSTS.ATA_CREATION

  // Total cost to taker (transaction fee + ATA creation if needed)
  // Note: Contract fee is handled by the contract itself, not directly paid by taker
  const totalCost = transactionFee + takerAtaCost + takerReceiveAtaCost

  return {
    transactionFee,
    contractFee, // For information only - paid by contract
    takerAtaCost,
    takerReceiveAtaCost,
    takerAtaExists,
    takerReceiveAtaExists,
    totalCost,
    breakdown: {
      recoverable: takerAtaCost + takerReceiveAtaCost,
      nonRecoverable: transactionFee
    }
  }
}