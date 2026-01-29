/**
 * Fee and transaction cost constants
 */

// Fee configuration
export const FEE_CONFIG = {
  MAKER_FEE_SOL: 0.001, // Base platform fee for maker (non-recoverable)
  MAKER_FEE_LAMPORTS: 1000000, // 0.001 SOL in lamports
  TAKER_FEE_SOL: 0.0006, // Base platform fee for taker (non-recoverable)
  TAKER_FEE_LAMPORTS: 600000, // 0.0006 SOL in lamports
  WALLET: 'HP5t6d24hgtcP7r1HxKQM8Nu471gqu7A2UJ5HoAESTPv' // Our fee wallet address
}

// Contract fee account (receives 0.001 SOL from contract)
export const CONTRACT_FEE_ACCOUNT = 'feeLpAUDSsYBMwpxvVr5hwwDQE32BcWXRfAd3A6agWx'

// Transaction cost constants (in SOL)
export const TRANSACTION_COSTS = {
  ESCROW_RENT: 0.0044, // Rent for escrow accounts (recoverable)
  CONTRACT_FEE: 0.001, // Contract fee (non-recoverable, paid to contract)
  PLATFORM_MAKER_FEE: 0.001, // Base platform fee for maker (non-recoverable, sent to platform wallet)
  PLATFORM_TAKER_FEE: 0.0006, // Base platform fee for taker (non-recoverable, sent to platform wallet)
  ATA_CREATION: 0.0022, // Cost to create an Associated Token Account (recoverable)
  TRANSACTION_FEE: 0.0006 // Estimated transaction fee for exchange (includes base fee + overhead)
}

// Option to fund taker's transaction costs from platform wallet
export const FUND_TAKER_COSTS = true // Set to true to cover taker's costs from collected fees
