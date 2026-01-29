/**
 * Shop Fee Service
 * Centralized logic for calculating and handling shop fees
 * Shops can add flat fees (maker/taker) and/or percentage fees on top of base platform fees
 */

import { PublicKey } from '@solana/web3.js'
import { SystemProgram } from '@solana/web3.js'
import { FEE_CONFIG, TRANSACTION_COSTS } from './constants/fees'

/**
 * Shop fee configuration
 * @typedef {Object} ShopFee
 * @property {string} wallet - Shop wallet address to receive fees
 * @property {number} makerFlatFee - Maker flat fee in SOL (optional)
 * @property {number} takerFlatFee - Taker flat fee in SOL (optional)
 * @property {number} makerPercentFee - Maker percentage fee (0-100, optional)
 * @property {number} takerPercentFee - Taker percentage fee (0-100, optional)
 */

/**
 * Calculate shop fee amounts
 * @param {ShopFee|null} shopFee - Shop fee configuration
 * @param {boolean} isMaker - Whether this is for maker (true) or taker (false)
 * @param {number} tradeValue - Trade value in SOL (for percentage fees, optional)
 * @returns {Object} Fee breakdown
 */
export function calculateShopFees(shopFee, isMaker = true, tradeValue = 0) {
  if (!shopFee || !shopFee.wallet) {
    return {
      hasFees: false,
      shopFee: 0,
      shopFeeLamports: 0,
      shopWallet: null
    }
  }

  let feeAmount = 0
  
  if (isMaker) {
    // Maker fees: flat fee + percentage fee
    feeAmount = (shopFee.makerFlatFee || 0)
    if (shopFee.makerPercentFee && tradeValue > 0) {
      feeAmount += (tradeValue * shopFee.makerPercentFee / 100)
    }
  } else {
    // Taker fees: flat fee + percentage fee
    feeAmount = (shopFee.takerFlatFee || 0)
    if (shopFee.takerPercentFee && tradeValue > 0) {
      feeAmount += (tradeValue * shopFee.takerPercentFee / 100)
    }
  }

  const hasFees = feeAmount > 0

  if (!hasFees) {
    return {
      hasFees: false,
      shopFee: 0,
      shopFeeLamports: 0,
      shopWallet: null
    }
  }

  const shopFeeLamports = Math.floor(feeAmount * 1_000_000_000)

  return {
    hasFees: true,
    shopFee: feeAmount,
    shopFeeLamports,
    shopWallet: new PublicKey(shopFee.wallet)
  }
}

/**
 * Get platform fee for maker
 * @returns {Object} Platform fee configuration
 */
export function getPlatformMakerFee() {
  return {
    amount: TRANSACTION_COSTS.PLATFORM_MAKER_FEE,
    amountLamports: FEE_CONFIG.MAKER_FEE_LAMPORTS,
    wallet: new PublicKey(FEE_CONFIG.WALLET)
  }
}

/**
 * Get platform fee for taker
 * @returns {Object} Platform fee configuration
 */
export function getPlatformTakerFee() {
  return {
    amount: TRANSACTION_COSTS.PLATFORM_TAKER_FEE,
    amountLamports: FEE_CONFIG.TAKER_FEE_LAMPORTS,
    wallet: new PublicKey(FEE_CONFIG.WALLET)
  }
}

/**
 * Create fee transfer instructions for escrow creation (maker fees)
 * @param {Object} params - Parameters
 * @param {PublicKey} params.maker - Maker's public key
 * @param {ShopFee|null} params.shopFee - Shop fee configuration
 * @param {Transaction} params.transaction - Transaction to add instructions to
 * @param {number} params.tradeValue - Trade value in SOL (for percentage fees, optional)
 * @returns {void} Modifies transaction in place
 */
export function addMakerFeeInstructions({ maker, shopFee, transaction, tradeValue = 0 }) {
  const platformFeeWallet = new PublicKey(FEE_CONFIG.WALLET)

  // Always charge base platform fee
  const platformFeeTransfer = SystemProgram.transfer({
    fromPubkey: maker,
    toPubkey: platformFeeWallet,
    lamports: FEE_CONFIG.MAKER_FEE_LAMPORTS
  })
  transaction.add(platformFeeTransfer)

  // Add shop fee if configured (shop keeps 100% of their fees)
  if (shopFee && shopFee.wallet) {
    const shopFeeBreakdown = calculateShopFees(shopFee, true, tradeValue)
    
    if (shopFeeBreakdown.hasFees && shopFeeBreakdown.shopFeeLamports > 0) {
      const shopFeeTransfer = SystemProgram.transfer({
        fromPubkey: maker,
        toPubkey: shopFeeBreakdown.shopWallet,
        lamports: shopFeeBreakdown.shopFeeLamports
      })
      transaction.add(shopFeeTransfer)
    }
  }
}

/**
 * Calculate taker fee for exchange
 * @param {ShopFee|null} shopFee - Shop fee configuration
 * @param {number} tradeValue - Trade value in SOL (for percentage fees, optional)
 * @returns {Object} Taker fee breakdown
 */
export function calculateTakerFee(shopFee, tradeValue = 0) {
  const basePlatformFee = TRANSACTION_COSTS.PLATFORM_TAKER_FEE
  const transactionFee = TRANSACTION_COSTS.TRANSACTION_FEE
  let shopTakerFee = 0
  
  if (shopFee && shopFee.wallet) {
    const shopFeeBreakdown = calculateShopFees(shopFee, false, tradeValue)
    shopTakerFee = shopFeeBreakdown.shopFee || 0
  }
  
  return {
    platformFee: basePlatformFee,
    transactionFee,
    shopTakerFee,
    totalFee: basePlatformFee + transactionFee + shopTakerFee
  }
}
