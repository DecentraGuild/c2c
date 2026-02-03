export const BASE_CURRENCIES = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    name: 'Solana',
    symbol: 'SOL',
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    sellerFeeBasisPoints: 0,
    decimals: 9,
    isNative: true
  },
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    name: 'USD Coin',
    symbol: 'USDC',
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    sellerFeeBasisPoints: 0,
    decimals: 6,
    isNative: false
  },
  {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    name: 'Tether USD',
    symbol: 'USDT',
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
    sellerFeeBasisPoints: 0,
    decimals: 6,
    isNative: false
  },
  {
    mint: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
    name: 'Wrapped Bitcoin (Portal)',
    symbol: 'WBTC',
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh/logo.png',
    sellerFeeBasisPoints: 0,
    decimals: 8,
    isNative: false
  }
]

/**
 * Get base currency by mint address
 * @param {string} mint - Mint address
 * @returns {Object|null} Base currency object or null
 */
export function getBaseCurrency(mint) {
  return BASE_CURRENCIES.find(c => c.mint === mint) || null
}

/**
 * Get base currency by symbol
 * @param {string} symbol - Currency symbol (SOL, USDC, USDT, WBTC)
 * @returns {Object|null} Base currency object or null
 */
export function getBaseCurrencyBySymbol(symbol) {
  return BASE_CURRENCIES.find(c => c.symbol === symbol?.toUpperCase()) || null
}

/**
 * Get all currency info for a storefront
 * Combines baseCurrency and customCurrencies from storefront config
 * @param {Object} storefront - Storefront object with baseCurrency (string or array) and customCurrencies
 * @returns {Array} Array of currency objects with mint, name, symbol
 */
export function getStorefrontCurrencies(storefront) {
  return getCollectionCurrencies(storefront)
}

/**
 * Get all currency info for a collection/storefront (legacy name)
 * @param {Object} collection - Storefront/collection object with baseCurrency and customCurrencies
 * @returns {Array} Array of currency objects with mint, name, symbol
 */
export function getCollectionCurrencies(collection) {
  const currencies = []
  
  // Add base currencies if specified (can be string or array)
  if (collection.baseCurrency) {
    const baseCurrencySymbols = Array.isArray(collection.baseCurrency) 
      ? collection.baseCurrency 
      : [collection.baseCurrency]
    
    baseCurrencySymbols.forEach(symbol => {
      const baseCurrency = getBaseCurrencyBySymbol(symbol)
      if (baseCurrency) {
        // Avoid duplicates
        if (!currencies.find(c => c.mint === baseCurrency.mint)) {
          currencies.push({
            mint: baseCurrency.mint,
            name: baseCurrency.name,
            symbol: baseCurrency.symbol,
            isBase: true
          })
        }
      }
    })
  }
  
  // Add custom currencies
  if (collection.customCurrencies && Array.isArray(collection.customCurrencies)) {
    collection.customCurrencies.forEach(currency => {
      if (typeof currency === 'string') {
        // Just a mint address, try to find in base currencies
        const baseCurrency = getBaseCurrency(currency)
        if (baseCurrency) {
          // Avoid duplicates
          if (!currencies.find(c => c.mint === baseCurrency.mint)) {
            currencies.push({
              mint: baseCurrency.mint,
              name: baseCurrency.name,
              symbol: baseCurrency.symbol,
              isBase: true
            })
          }
        } else {
          currencies.push({
            mint: currency,
            name: null,
            symbol: null,
            isBase: false
          })
        }
      } else {
        // Full currency object
        currencies.push({
          mint: currency.mint,
          name: currency.name || null,
          symbol: currency.symbol || currency.name || null,
          isBase: false
        })
      }
    })
  }
  
  return currencies
}
