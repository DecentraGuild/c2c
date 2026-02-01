/**
 * Marketplace helper utilities
 * Functions for filtering and categorizing escrows for marketplace display
 */

import { PublicKey } from '@solana/web3.js'
import { getCollectionCurrencies } from './constants/baseCurrencies'

/**
 * Get shop currency mint addresses (baseCurrency + customCurrencies) for a collection
 * @param {Object} collection - Collection object with baseCurrency and customCurrencies
 * @returns {Array<string>} Array of currency mint addresses
 */
export function getShopCurrencyMints(collection) {
  if (!collection) return []
  const currencies = getCollectionCurrencies(collection)
  return currencies.map(c => c.mint).filter(Boolean)
}

/**
 * Check if a mint belongs to the shop (collection mints, cached NFT mints, or shop currencies)
 * @param {string} mintAddress - Token mint address
 * @param {Object} collection - Collection object with collectionMints and baseCurrency/customCurrencies
 * @param {{ cachedCollectionMints?: Set<string>|Array<string> }} [options] - Optional cached NFT mints from collection metadata (individual NFTs in collection)
 * @returns {boolean} True if mint is part of the shop
 */
export function belongsToShop(mintAddress, collection, options = {}) {
  if (!mintAddress || !collection) return false
  const { cachedCollectionMints } = options
  const mint = String(mintAddress).toLowerCase()
  if (cachedCollectionMints && cachedCollectionMints.size !== undefined) {
    if (cachedCollectionMints.has(mint)) return true
  } else if (cachedCollectionMints && Array.isArray(cachedCollectionMints)) {
    if (cachedCollectionMints.some(m => String(m).toLowerCase() === mint)) return true
  }
  const collectionMints = collection.collectionMints || []
  if (belongsToCollection(mintAddress, collectionMints, cachedCollectionMints)) return true
  const shopCurrencyMints = getShopCurrencyMints(collection)
  return shopCurrencyMints.includes(mintAddress)
}

/**
 * Check if a mint address belongs to a collection
 * @param {string} mintAddress - Token/NFT mint address
 * @param {Array<string|Object>} collectionMints - Array of collection mint addresses (strings) or objects with mint property
 * @param {Set<string>|Array<string>} [cachedCollectionMints] - Optional set/array of individual NFT mints from collection metadata cache
 * @returns {boolean} True if mint belongs to collection
 */
export function belongsToCollection(mintAddress, collectionMints = [], cachedCollectionMints = null) {
  if (!mintAddress) return false
  const mint = String(mintAddress).toLowerCase()
  if (cachedCollectionMints) {
    if (cachedCollectionMints.size !== undefined && cachedCollectionMints.has(mint)) return true
    if (Array.isArray(cachedCollectionMints) && cachedCollectionMints.some(m => String(m).toLowerCase() === mint)) return true
  }
  if (!collectionMints || collectionMints.length === 0) return false

  const firstItem = collectionMints[0]
  if (typeof firstItem === 'string') {
    return collectionMints.some(m => String(m).toLowerCase() === mint)
  }
  if (typeof firstItem === 'object' && firstItem.mint) {
    return collectionMints.some(item => String(item.mint).toLowerCase() === mint)
  }
  return false
}

/**
 * Get fetching type for a mint address in a collection
 * @param {string} mintAddress - Token/NFT mint address
 * @param {Array<string|Object>} collectionMints - Array of collection mint addresses
 * @returns {string|null} 'Token', 'NFT', or null if not found
 */
export function getFetchingType(mintAddress, collectionMints = []) {
  if (!mintAddress || !collectionMints || collectionMints.length === 0) {
    return null
  }
  
  // Find the collection item
  const item = collectionMints.find(item => {
    if (typeof item === 'string') {
      return item === mintAddress
    } else if (typeof item === 'object' && item.mint) {
      return item.mint === mintAddress
    }
    return false
  })
  
  if (item && typeof item === 'object' && item.fetchingType) {
    return item.fetchingType
  }
  
  // Default: if it's an object without fetchingType, assume it's a Token
  // If it's a string, we can't determine the type
  return typeof item === 'object' ? 'Token' : null
}

/**
 * Check if a mint address is an allowed currency for a collection
 * @param {string} mintAddress - Token mint address
 * @param {Array<string>} allowedCurrencies - Array of allowed currency mint addresses
 * @returns {boolean} True if mint is an allowed currency
 */
export function isAllowedCurrency(mintAddress, allowedCurrencies = []) {
  if (!mintAddress || !allowedCurrencies || allowedCurrencies.length === 0) {
    return true // If no restrictions, all currencies allowed
  }
  
  return allowedCurrencies.includes(mintAddress)
}

/**
 * Determine trade type for an escrow
 * @param {Object} escrow - Formatted escrow object
 * @param {Array<string>} collectionMints - Array of collection mint addresses
 * @param {Array<string>} allowedCurrencies - Array of allowed (shop) currency mint addresses
 * @param {Set<string>|Array<string>} [cachedCollectionMints] - Optional individual NFT mints from collection metadata cache
 * @returns {string} Trade type: 'buy', 'sell', 'trade', 'swap', or null
 */
export function getTradeType(escrow, collectionMints = [], allowedCurrencies = [], cachedCollectionMints = null) {
  if (!escrow || !escrow.depositToken || !escrow.requestToken) {
    return null
  }

  const depositMint = escrow.depositToken.mint
  const requestMint = escrow.requestToken.mint

  const depositIsNFT = belongsToCollection(depositMint, collectionMints, cachedCollectionMints)
  const requestIsNFT = belongsToCollection(requestMint, collectionMints, cachedCollectionMints)
  const depositIsCurrency = isAllowedCurrency(depositMint, allowedCurrencies)
  const requestIsCurrency = isAllowedCurrency(requestMint, allowedCurrencies)
  
  // Swap: both sides are shop currencies (currency -> currency)
  if (depositIsCurrency && requestIsCurrency) {
    return 'swap'
  }
  
  // Buy order: SPL currency -> NFT (user wants to buy NFT with currency)
  if (depositIsCurrency && requestIsNFT) {
    return 'buy'
  }
  
  // Sell order: NFT -> SPL currency (user wants to sell NFT for currency)
  if (depositIsNFT && requestIsCurrency) {
    return 'sell'
  }
  
  // Trade order: NFT -> NFT (user wants to trade NFT for NFT)
  if (depositIsNFT && requestIsNFT) {
    return 'trade'
  }
  
  return null
}

/**
 * Filter escrows by collection (storefront)
 * Only show trades where BOTH deposit and request are from the shop (collection mints, cached NFT mints, or shop currencies)
 * @param {Array} escrows - Array of formatted escrow objects
 * @param {Object} collection - Collection object with collectionMints and baseCurrency/customCurrencies
 * @param {{ cachedCollectionMints?: Set<string>|Array<string> }} [options] - Optional cached NFT mints from collection metadata
 * @returns {Array} Filtered escrows that match the collection
 */
export function filterEscrowsByCollection(escrows, collection, options = {}) {
  if (!escrows || !collection) {
    return []
  }

  return escrows.filter(escrow => {
    if (!escrow.depositToken || !escrow.requestToken) {
      return false
    }

    const depositMint = escrow.depositToken.mint
    const requestMint = escrow.requestToken.mint

    return belongsToShop(depositMint, collection, options) && belongsToShop(requestMint, collection, options)
  })
}

/**
 * Sort escrows: user's fillable trades first, then others
 * @param {Array} escrows - Array of formatted escrow objects
 * @param {Object} userBalances - Map of user token balances (mint -> balance)
 * @returns {Array} Sorted escrows
 */
export function sortEscrowsByUserBalance(escrows, userBalances = {}) {
  if (!escrows || escrows.length === 0) {
    return []
  }
  
  return [...escrows].sort((a, b) => {
    // Check if user can fill escrow A
    const canFillA = canUserFillEscrow(a, userBalances)
    const canFillB = canUserFillEscrow(b, userBalances)
    
    // User's fillable trades first
    if (canFillA && !canFillB) return -1
    if (!canFillA && canFillB) return 1
    
    // Both fillable or both not fillable - maintain original order
    return 0
  })
}

/**
 * Calculate minimum fillable amount of request token (respecting decimals)
 * @param {Object} escrow - Formatted escrow object
 * @returns {number} Minimum fillable amount in request token units
 */
function calculateMinimumFillableAmount(escrow) {
  if (!escrow || !escrow.depositToken || !escrow.requestToken || !escrow.price) {
    return 0
  }
  
  const depositDecimals = escrow.depositToken.decimals || 0
  const requestDecimals = escrow.requestToken.decimals || 0
  const price = escrow.price
  
  // Minimum fillable = 1 smallest unit of deposit token
  // Amount needed in request token = (1 / 10^depositDecimals) * price
  const minDepositUnit = 1 / Math.pow(10, depositDecimals)
  const minRequestAmount = minDepositUnit * price
  
  // Round up to respect request token decimals
  if (requestDecimals === 0) {
    // For 0-decimal tokens, need at least 1 whole unit
    return Math.max(1, Math.ceil(minRequestAmount))
  } else {
    // Round up to smallest unit of request token
    const smallestRequestUnit = 1 / Math.pow(10, requestDecimals)
    return Math.ceil(minRequestAmount / smallestRequestUnit) * smallestRequestUnit
  }
}

/**
 * Check if user can fill an escrow based on their balances
 * Accounts for partial fills, decimals, and minimum fillable amounts
 * @param {Object} escrow - Formatted escrow object
 * @param {Object} userBalances - Map of user token balances (mint -> balance)
 * @returns {boolean} True if user has balance to fill the escrow
 */
export function canUserFillEscrow(escrow, userBalances = {}) {
  if (!escrow || !escrow.requestToken || escrow.status !== 'active') {
    return false
  }
  
  const requestMint = escrow.requestToken.mint
  const userBalance = userBalances[requestMint] || 0
  
  if (userBalance <= 0) {
    return false
  }
  
  // If partial fill is not allowed, user must have enough for full amount
  if (!escrow.allowPartialFill) {
    return userBalance >= escrow.requestAmount
  }
  
  // If partial fill is allowed, check if user has enough for at least 1 unit
  const minFillableAmount = calculateMinimumFillableAmount(escrow)
  
  // Ensure minimum fillable amount is valid and greater than 0
  if (minFillableAmount <= 0) {
    return false
  }
  
  // User must have at least the minimum fillable amount
  return userBalance >= minFillableAmount
}

/**
 * Filter escrows by trade type
 * @param {Array} escrows - Array of formatted escrow objects
 * @param {string} tradeType - Trade type: 'buy', 'sell', 'trade', 'swap', or 'all'
 * @param {Object} collection - Collection object
 * @returns {Array} Filtered escrows
 */
export function filterEscrowsByTradeType(escrows, tradeType, collection) {
  if (!escrows || tradeType === 'all') {
    return escrows
  }
  
  const collectionMints = collection?.collectionMints || []
  const allowedCurrencies = getShopCurrencyMints(collection) || collection?.allowedCurrencies || []
  
  return escrows.filter(escrow => {
    const escrowTradeType = getTradeType(escrow, collectionMints, allowedCurrencies)
    return escrowTradeType === tradeType
  })
}

/**
 * Filter active escrows only
 * @param {Array} escrows - Array of formatted escrow objects
 * @returns {Array} Active escrows only
 */
export function filterActiveEscrows(escrows) {
  if (!escrows) {
    return []
  }
  
  return escrows.filter(escrow => escrow.status === 'active')
}

/**
 * Group escrows by collection
 * @param {Array} escrows - Array of formatted escrow objects
 * @param {Array} collections - Array of collection objects
 * @returns {Array} Array of groups: [{ collection: Object|null, escrows: Array, label: string }, ...]
 */
export function groupEscrowsByCollection(escrows, collections = []) {
  if (!escrows || escrows.length === 0) {
    return []
  }
  
  // Map to track which escrows belong to which collection
  const escrowToCollection = new Map()
  const p2pEscrows = []
  
  // Check each escrow against all collections
  escrows.forEach(escrow => {
    let matched = false
    
    for (const collection of collections) {
      const matchedEscrows = filterEscrowsByCollection([escrow], collection)
      if (matchedEscrows.length > 0) {
        const collectionId = collection.id || collection.collectionMint
        if (!escrowToCollection.has(collectionId)) {
          escrowToCollection.set(collectionId, {
            collection,
            escrows: []
          })
        }
        escrowToCollection.get(collectionId).escrows.push(escrow)
        matched = true
        break // Escrow can only belong to one collection
      }
    }
    
    // If no collection matched, it's a P2P trade
    if (!matched) {
      p2pEscrows.push(escrow)
    }
  })
  
  // Build result array
  const groups = []
  
  // Add P2P trades first
  if (p2pEscrows.length > 0) {
    groups.push({
      collection: null,
      escrows: p2pEscrows,
      label: 'P2P Trades',
      id: 'p2p'
    })
  }
  
  // Add collection groups
  escrowToCollection.forEach((group, collectionId) => {
    groups.push({
      collection: group.collection,
      escrows: group.escrows,
      label: group.collection.name || 'Unknown Collection',
      id: collectionId
    })
  })
  
  return groups
}
