/**
 * UI and user experience constants
 */

// UI timing constants
export const UI_CONSTANTS = {
  TOAST_DURATION: 4000, // 4 seconds (default toast display)
  TOAST_DURATION_LONG: 5000, // 5 seconds (important messages)
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  METADATA_LOADING_DELAY: 100, // Small delay for initial metadata fetches to start
  DROPDOWN_BLUR_DELAY: 200, // ms before closing dropdown on blur (allows click to fire)
  QR_CODE_SIZE: 280, // Share modal QR code size in pixels
  RPC_ESCROW_FETCH_TIMEOUT_MS: 25000, // Timeout for fetching escrows (avoids hang on slow/mobile networks)
  RPC_BALANCE_FETCH_TIMEOUT_MS: 25000 // Timeout for fetching wallet balances (avoids hang on slow/mobile networks)
}

// Debounce delay constants (in milliseconds)
export const DEBOUNCE_DELAYS = {
  SHORT: 150,
  MEDIUM: 300,
  LONG: 500,
  DEFAULT: 300
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
  ESCROW_DRAFTS: 'escrowDrafts',
  TOKEN_METADATA: 'token_metadata_cache',
  CACHE_TIMESTAMP: 'token_cache_timestamp'
}

// Cache configuration
export const CACHE_CONFIG = {
  // Metadata: persisted in localStorage, reused across pages/sections so we don't re-fetch on navigation
  METADATA_TTL: 30 * 24 * 60 * 60 * 1000, // 7 days – tokens we've successfully fetched are cached
  REGISTRY_TTL: 24 * 60 * 60 * 1000, // 24 hours
  MAX_METADATA_ENTRIES: 1000 // Maximum cached token metadata entries
}

// Batch processing sizes
export const BATCH_SIZES = {
  ESCROW_PROCESSING: 20, // Process escrows in batches of 20 to avoid UI blocking
  NFT_METADATA_FETCH: 50, // Fetch NFT metadata in batches of 50
  METADATA_FETCH: 10 // General metadata fetching batch size
}

// Subscription pricing (onboard / shopowner agreement display)
// Yearly = 12 * monthly * (1 - YEARLY_DISCOUNT); 50% off => 300
export const SUBSCRIPTION_PRICING = {
  BASE_MONTHLY_USD: 50,
  YEARLY_DISCOUNT: 0.5, // 50% off when billing yearly
  BASE_YEARLY_USD: 300,
  ADDON_EXTRA_MINTS_MONTHLY: 10, // per 50 additional mints
  ADDON_CUSTOM_CURRENCY_MONTHLY: 5 // custom currency add-on
}

// Search and pagination limits
export const SEARCH_LIMITS = {
  TOKEN_SEARCH_RESULTS: 100, // Maximum token search results to return
  TOKEN_SEARCH_DISPLAY: 50, // Maximum tokens to display in UI
  NFT_FETCH_LIMIT: 10000 // Safety limit for NFT fetching
}
