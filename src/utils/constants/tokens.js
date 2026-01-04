/**
 * Token configuration constants
 */

// Native SOL configuration
export const NATIVE_SOL = {
  mint: 'So11111111111111111111111111111111111111112',
  decimals: 9
}

/**
 * Token Object Structure
 * Standard format for token objects used throughout the application
 * 
 * @typedef {Object} TokenObject
 * @property {string} mint - Token mint address (required)
 * @property {string|null} symbol - Token symbol (e.g., 'USDC', 'SOL')
 * @property {string|null} name - Token name (e.g., 'USD Coin', 'Solana')
 * @property {string|null} image - Token image/logo URL
 * @property {number} decimals - Token decimals (required)
 * @property {number|null} [balance] - Token balance (optional, for wallet tokens)
 * @property {boolean} [isNative] - Whether this is native SOL (optional)
 * 
 * @example
 * {
 *   mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
 *   symbol: 'USDC',
 *   name: 'USD Coin',
 *   image: 'https://...',
 *   decimals: 6,
 *   balance: 1000.5,
 *   isNative: false
 * }
 */
export const TOKEN_OBJECT_SCHEMA = {
  // Required fields
  mint: 'string',
  decimals: 'number',
  // Optional fields
  symbol: 'string|null',
  name: 'string|null',
  image: 'string|null',
  balance: 'number|null',
  isNative: 'boolean'
}

// Common SPL tokens (for quick reference)
export const COMMON_TOKENS = {
  USDC_MAINNET: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT_MAINNET: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  USDC_DEVNET: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  USDT_DEVNET: 'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS'
}
