/**
 * UI and user experience constants
 */

// UI timing constants
export const UI_CONSTANTS = {
  TOAST_DURATION: 5000, // 5 seconds
  DEBOUNCE_DELAY: 500, // 500ms
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
}

// Decimal formatting constants
export const DECIMAL_CONSTANTS = {
  MAX_DISPLAY_DECIMALS: 6, // Maximum decimals to display in UI
  MAX_STEP_DECIMALS: 9, // Maximum decimals for input step calculation
  DEFAULT_DECIMALS: 2, // Default decimal places
  MIN_DECIMALS: 0, // Minimum decimal places
  STEP_THRESHOLDS: {
    TWO: 2,
    FOUR: 4,
    SIX: 6,
    EIGHT: 8
  },
  STEP_VALUES: {
    TWO: '0.01',
    FOUR: '0.0001',
    SIX: '0.000001',
    EIGHT: '0.00000001',
    NINE: '0.000000001'
  }
}

// Wallet providers
export const WALLET_PROVIDERS = {
  PHANTOM: 'Phantom',
  SOLFLARE: 'Solflare',
  BACKPACK: 'Backpack',
  GLOW: 'Glow',
  COINBASE: 'Coinbase Wallet',
  MATHWALLET: 'MathWallet',
  TRUST: 'Trust Wallet'
}

// Local storage keys
export const STORAGE_KEYS = {
  CONNECTED_WALLET: 'connectedWallet',
  THEME_PREFERENCE: 'themePreference',
  RECENT_TOKENS: 'recentTokens',
  ESCROW_DRAFTS: 'escrowDrafts'
}

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INSUFFICIENT_BALANCE: 'Insufficient token balance',
  INVALID_ADDRESS: 'Invalid Solana address',
  INVALID_AMOUNT: 'Invalid amount entered',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  TOKEN_NOT_FOUND: 'Token not found',
  EXPIRED_ESCROW: 'This escrow has expired'
}

// Success messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  ESCROW_CREATED: 'Escrow created successfully',
  ESCROW_FILLED: 'Escrow filled successfully',
  ESCROW_CLOSED: 'Escrow closed successfully',
  LINK_COPIED: 'Link copied to clipboard'
}
