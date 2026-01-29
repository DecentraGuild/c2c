/**
 * Escrow program configuration constants
 */

// Escrow program ID
export const ESCROW_PROGRAM_ID = 'esccxeEDYUXQaeMwq1ZwWAvJaHVYfsXNva13JYb2Chs'

// Whitelist program configuration (from working repo)
export const WHITELIST_PROGRAM_ID = 'whi5uDPWK4rAE9Sus6hdxdHwsG1hjDBn6kXM6pyqwTn'

// Escrow default settings
export const ESCROW_DEFAULTS = {
  PARTIAL_FILL: true,
  SLIPPAGE_MILLI_PERCENT: 1, // 0.001% = 1 milli%
  MIN_EXPIRATION_MINUTES: 5
}

// Slippage conversion constant
// Slippage is stored as milli-percent (1 = 0.001%)
// Divide by this to convert to decimal (0.001% = 0.00001)
export const SLIPPAGE_DIVISOR = 100000

// Validation limits
export const VALIDATION_LIMITS = {
  MAX_WHITELIST_ADDRESSES: 100,
  MIN_AMOUNT: 0.000001,
  MAX_SLIPPAGE_MILLI_PERCENT: 10000, // 10%
  ADDRESS_LENGTH: 44 // Typical Solana address length
}
