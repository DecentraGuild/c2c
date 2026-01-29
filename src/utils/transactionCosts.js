/**
 * Transaction Cost Calculator
 * Calculates the total SOL cost for escrow transactions including ATA creation costs
 */

import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { checkAtaExists } from './ataUtils'
import { TRANSACTION_COSTS, FEE_CONFIG } from './constants/fees'
import { calculateShopFees, getPlatformMakerFee, calculateTakerFee } from './marketplaceFees'

/**
 * Calculate transaction costs for creating an escrow
 * @param {Object} params - Cost calculation parameters
 * @param {PublicKey|string} params.maker - Maker's public key
 * @param {PublicKey|string} params.depositTokenMint - Deposit token mint address
 * @param {PublicKey|string} params.requestTokenMint - Request token mint address
 * @param {Object|null} params.shopFee - Shop fee configuration: { wallet, makerFlatFee, takerFlatFee, makerPercentFee, takerPercentFee }
 * @param {number} params.tradeValue - Trade value in SOL (for percentage fees, optional)
 * @param {Connection} params.connection - Solana connection
 * @returns {Promise<Object>} Cost breakdown object
 */
export async function calculateEscrowCreationCosts({
  maker,
  depositTokenMint,
  requestTokenMint,
  depositAmount = null,
  shopFee = null,
  tradeValue = 0,
  connection
}) {
  const makerPubkey = maker instanceof PublicKey ? maker : new PublicKey(maker)
  const depositTokenPubkey = new PublicKey(depositTokenMint)
  const requestTokenPubkey = new PublicKey(requestTokenMint)

  // Check if ATAs exist
  const depositAtaExists = await checkAtaExists(depositTokenPubkey, makerPubkey, connection)
  const requestAtaExists = await checkAtaExists(requestTokenPubkey, makerPubkey, connection)

  // Calculate base costs
  const escrowRent = TRANSACTION_COSTS.ESCROW_RENT
  const contractFee = TRANSACTION_COSTS.CONTRACT_FEE
  const depositAtaCost = depositAtaExists ? 0 : TRANSACTION_COSTS.ATA_CREATION
  const requestAtaCost = requestAtaExists ? 0 : TRANSACTION_COSTS.ATA_CREATION

  // Always charge base platform fee
  const platformFee = TRANSACTION_COSTS.PLATFORM_MAKER_FEE
  
  // Calculate shop fee if configured
  let shopFeeAmount = 0
  if (shopFee && shopFee.wallet) {
    const shopFeeBreakdown = calculateShopFees(shopFee, true, tradeValue)
    shopFeeAmount = shopFeeBreakdown.shopFee || 0
  }

  const totalCost = escrowRent + contractFee + platformFee + shopFeeAmount + depositAtaCost + requestAtaCost

  return {
    escrowRent,
    contractFee,
    platformFee,
    shopFee: shopFeeAmount,
    depositAtaCost,
    requestAtaCost,
    depositAtaExists,
    requestAtaExists,
    totalCost,
    breakdown: {
      recoverable: escrowRent + depositAtaCost + requestAtaCost,
      nonRecoverable: contractFee + platformFee + shopFeeAmount
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
  
  // Group all recoverable costs together (token accounts + escrow account rent)
  const totalRecoverableCost = costs.depositAtaCost + costs.requestAtaCost + costs.escrowRent
  if (totalRecoverableCost > 0) {
    items.push({
      label: 'Solana Token Accounts (recoverable)',
      amount: totalRecoverableCost,
      recoverable: true
    })
  }

  // Group contract fee + platform fee + shop fee together
  const totalFees = costs.contractFee + (costs.platformFee || 0) + (costs.shopFee || 0)
  items.push({
    label: 'Escrow fee',
    amount: totalFees,
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
 * @param {Object|null} params.shopFee - Shop fee configuration: { wallet, makerFlatFee, takerFlatFee, makerPercentFee, takerPercentFee }
 * @param {number} params.tradeValue - Trade value in SOL (for percentage fees, optional)
 * @param {Connection} params.connection - Solana connection
 * @returns {Promise<Object>} Cost breakdown object
 */
export async function calculateExchangeCosts({
  taker,
  depositTokenMint,
  requestTokenMint,
  shopFee = null,
  tradeValue = 0,
  connection
}) {
  const takerPubkey = taker instanceof PublicKey ? taker : new PublicKey(taker)
  const depositTokenPubkey = new PublicKey(depositTokenMint)
  const requestTokenPubkey = new PublicKey(requestTokenMint)

  // Check if ATAs exist
  const takerAtaExists = await checkAtaExists(requestTokenPubkey, takerPubkey, connection)
  const takerReceiveAtaExists = await checkAtaExists(depositTokenPubkey, takerPubkey, connection)

  // Calculate costs
  const contractFee = TRANSACTION_COSTS.CONTRACT_FEE // Contract charges this, but it's paid by the contract logic
  const takerAtaCost = takerAtaExists ? 0 : TRANSACTION_COSTS.ATA_CREATION
  const takerReceiveAtaCost = takerReceiveAtaExists ? 0 : TRANSACTION_COSTS.ATA_CREATION

  // Calculate taker fee using centralized service
  const takerFeeBreakdown = calculateTakerFee(shopFee, tradeValue)
  const platformFee = takerFeeBreakdown.platformFee
  const transactionFee = takerFeeBreakdown.transactionFee
  const shopTakerFee = takerFeeBreakdown.shopTakerFee

  // Total cost to taker (platform fee + transaction fee + shop fee + ATA creation if needed)
  // Note: Contract fee is handled by the contract itself, not directly paid by taker
  const totalCost = platformFee + transactionFee + shopTakerFee + takerAtaCost + takerReceiveAtaCost

  return {
    platformFee,
    transactionFee,
    shopTakerFee,
    contractFee, // For information only - paid by contract
    takerAtaCost,
    takerReceiveAtaCost,
    takerAtaExists,
    takerReceiveAtaExists,
    totalCost,
    breakdown: {
      recoverable: takerAtaCost + takerReceiveAtaCost,
      nonRecoverable: platformFee + transactionFee + shopTakerFee
    }
  }
}