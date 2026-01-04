/**
 * Fee and transaction cost constants
 */

// Fee configuration
export const FEE_CONFIG = {
  AMOUNT_SOL: 0.009, // Fixed fee per trade (0.001 SOL is used by contract program)
  AMOUNT_LAMPORTS: 9000000, // 0.009 SOL in lamports
  WALLET: 'HP5t6d24hgtcP7r1HxKQM8Nu471gqu7A2UJ5HoAESTPv' // Our fee wallet address
}

// Contract fee account (receives 0.001 SOL from contract)
export const CONTRACT_FEE_ACCOUNT = 'feeLpAUDSsYBMwpxvVr5hwwDQE32BcWXRfAd3A6agWx'

// Transaction cost constants (in SOL)
export const TRANSACTION_COSTS = {
  ESCROW_RENT: 0.0044, // Rent for escrow accounts (recoverable)
  CONTRACT_FEE: 0.001, // Contract fee (non-recoverable)
  PLATFORM_FEE: 0.009, // Platform fee per contract trigger (non-recoverable, sent to platform wallet)
  ATA_CREATION: 0.0022, // Cost to create an Associated Token Account (recoverable)
  TRANSACTION_FEE: 0.0006 // Estimated transaction fee for exchange (includes base fee + overhead)
}

// Option to fund taker's transaction costs from platform wallet
export const FUND_TAKER_COSTS = true // Set to true to cover taker's costs from collected fees
