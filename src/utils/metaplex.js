/**
 * Utilities for fetching token metadata from Metaplex Token Metadata program
 * Hybrid approach: Token Registry first, then Metaplex on-chain fallback
 */

import { PublicKey, Connection } from '@solana/web3.js'
import { cleanTokenString } from './formatters'
import { loadTokenRegistryMap } from './tokenRegistry'
import { logDebug } from './logger'

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

// Wrapped SOL mint address (used for fetching SOL logo)
const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112'

/**
 * Get SOL metadata fallback (used when registry doesn't have it or fails)
 */
function getSOLMetadataFallback() {
  return {
    name: 'Solana',
    symbol: 'SOL',
    image: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    decimals: 9
  }
}

/**
 * Get token metadata from registry (fast, no RPC calls)
 * @param {string} mintAddress - Token mint address
 * @returns {Promise<Object|null>} Token metadata or null if not found
 */
async function getTokenFromRegistry(mintAddress) {
  // Special handling for wrapped SOL - always return SOL metadata
  if (mintAddress === WRAPPED_SOL_MINT) {
    try {
      const registry = await loadTokenRegistryMap()
      const tokenData = registry.get(mintAddress)
      
      // Use registry data if it has an image, otherwise use fallback
      if (tokenData && tokenData.image) {
        return tokenData
      }
    } catch (err) {
      logDebug(`Registry lookup failed for ${mintAddress}:`, err.message)
    }
    
    // Fallback for SOL if registry doesn't have it or fails
    return getSOLMetadataFallback()
  }
  
  // For other tokens, lookup in registry
  try {
    const registry = await loadTokenRegistryMap()
    return registry.get(mintAddress) || null
  } catch (err) {
    logDebug(`Registry lookup failed for ${mintAddress}:`, err.message)
    return null
  }
}

/**
 * Get token metadata from registry only (no RPC, no Metaplex fallback)
 * Useful for quick lookups when you know the token is in the registry
 * @param {string} mintAddress - Token mint address
 * @returns {Promise<Object|null>} Token metadata or null if not found
 */
export async function getTokenMetadataFromRegistry(mintAddress) {
  return await getTokenFromRegistry(mintAddress)
}

/**
 * Get the metadata PDA (Program Derived Address) for a given mint address
 */
export async function getMetadataPDA(mintAddress) {
  const mintPubkey = new PublicKey(mintAddress)
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintPubkey.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )
  return metadataPDA
}

/**
 * Fetch token metadata using hybrid approach: Registry first, then Metaplex
 * 
 * NOTE: This function returns metadata only (name, symbol, image, uri) without decimals.
 * For complete token info including decimals, use fetchTokenInfo from useTokenRegistry instead.
 * 
 * @param {Connection} connection - Solana connection
 * @param {string} mintAddress - Token mint address
 * @param {boolean} useRegistryFirst - Whether to check registry first (default: true)
 * @returns {Promise<Object|null>} Token metadata { name, symbol, image, uri } or null if not found
 */
export async function fetchTokenMetadata(connection, mintAddress, useRegistryFirst = true) {
  let registryData = null
  
  // Try registry first if enabled
  if (useRegistryFirst) {
    registryData = await getTokenFromRegistry(mintAddress)
    // If registry has complete data with image, return it immediately (no RPC call needed)
    if (registryData?.image) {
      return {
        name: cleanTokenString(registryData.name),
        symbol: cleanTokenString(registryData.symbol),
        image: registryData.image,
        uri: null
      }
    }
  }

  // Fetch from Metaplex on-chain (with retry logic for rate limits)
  const metaplexData = await fetchTokenMetadataFromChain(connection, mintAddress)
  
  // Merge registry and Metaplex data if both available
  if (registryData && metaplexData) {
    return {
      name: cleanTokenString(metaplexData.name || registryData.name),
      symbol: cleanTokenString(metaplexData.symbol || registryData.symbol),
      image: metaplexData.image || registryData.image,
      uri: metaplexData.uri
    }
  }
  
  // Return whichever data is available, ensuring names/symbols are cleaned
  const result = metaplexData || registryData
  if (result) {
    return {
      ...result,
      name: cleanTokenString(result.name),
      symbol: cleanTokenString(result.symbol)
    }
  }
  return null
}

/**
 * Retry RPC call with exponential backoff for rate limit errors only
 * No retries for other errors (broken links, 404s, etc.)
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 1, only for rate limits)
 * @returns {Promise<any>} Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 1) {
  let lastError
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Only retry for rate limit errors (429)
      // Solana web3.js may wrap HTTP errors, so check multiple error properties
      const errorMessage = error?.message || error?.toString() || ''
      const isRateLimit = 
        errorMessage.includes('429') || 
        errorMessage.includes('Too Many Requests') ||
        error?.code === 429 ||
        error?.status === 429 ||
        (error?.response && error.response.status === 429) ||
        (error?.statusCode === 429)
      
      if (isRateLimit && attempt < maxRetries) {
        // Exponential backoff: 500ms, 1000ms
        const delay = 500 * Math.pow(2, attempt)
        logDebug(`Server responded with 429. Retrying after ${delay}ms delay...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Not a rate limit error or max retries reached - fail fast
      throw error
    }
  }
  throw lastError
}

/**
 * Fetch token metadata from Metaplex on-chain (original implementation)
 * @param {Connection} connection - Solana connection
 * @param {string} mintAddress - Token mint address
 * @returns {Promise<Object|null>} Token metadata or null if not found
 */
async function fetchTokenMetadataFromChain(connection, mintAddress) {
  try {
    const metadataPDA = await getMetadataPDA(mintAddress)
    
    // Use retry logic for RPC calls to handle rate limits only
    const accountInfo = await retryWithBackoff(
      () => connection.getAccountInfo(metadataPDA),
      1 // Max 1 retry (only for rate limits)
    )
    
    if (!accountInfo) {
      return null
    }

    // Parse metadata account data
    // Metaplex metadata account structure:
    // - 1 byte: key
    // - 32 bytes: update authority
    // - 32 bytes: mint
    // - 4 bytes: name string length + name string
    // - 4 bytes: symbol string length + symbol string
    // - 4 bytes: URI string length + URI string
    // ... (more fields)
    
    const data = accountInfo.data
    let offset = 1 + 32 + 32 // Skip key, update authority, mint
    
    // Read name
    const nameLength = data.readUInt32LE(offset)
    offset += 4
    const name = cleanTokenString(data.slice(offset, offset + nameLength).toString('utf8'))
    offset += nameLength
    
    // Read symbol
    const symbolLength = data.readUInt32LE(offset)
    offset += 4
    const symbol = cleanTokenString(data.slice(offset, offset + symbolLength).toString('utf8'))
    offset += symbolLength
    
    // Read URI (points to JSON metadata with image)
    const uriLength = data.readUInt32LE(offset)
    offset += 4
    const uri = data.slice(offset, offset + uriLength).toString('utf8').trim()
    offset += uriLength
    
    // Read seller_fee_basis_points (2 bytes)
    if (offset + 2 > data.length) {
      return {
        name: cleanTokenString(name),
        symbol: cleanTokenString(symbol),
        image: null,
        uri: uri || null,
        collection: null
      }
    }
    const sellerFeeBasisPoints = data.readUInt16LE(offset)
    offset += 2
    
    // Read creators (optional)
    // First byte: 1 if present, 0 if not
    let collection = null
    if (offset < data.length) {
      const hasCreators = data[offset] === 1
      offset += 1
      
      if (hasCreators && offset + 4 <= data.length) {
        const creatorsLength = data.readUInt32LE(offset)
        offset += 4
        // Skip creators data (variable length, complex structure)
        // Each creator is: 32 bytes (pubkey) + 1 byte (verified) + 1 byte (share)
        const creatorsDataLength = creatorsLength * 34
        if (offset + creatorsDataLength <= data.length) {
          offset += creatorsDataLength
        }
      }
      
      // Read collection (optional)
      // First byte: 1 if present, 0 if not
      if (offset < data.length) {
        const hasCollection = data[offset] === 1
        offset += 1
        if (hasCollection && offset + 33 <= data.length) {
          // Collection is: 1 byte (verified) + 32 bytes (pubkey)
          offset += 1 // Skip verified byte
          try {
            const collectionPubkey = new PublicKey(data.slice(offset, offset + 32))
            collection = collectionPubkey.toString()
          } catch (err) {
            // Invalid pubkey, skip
            logDebug(`Invalid collection pubkey for ${mintAddress}`)
          }
        }
      }
    }
    
    // Fetch JSON metadata from URI (IPFS/Arweave)
    let image = null
    if (uri && uri.length > 0 && !uri.startsWith('http://localhost')) {
      try {
        // Convert IPFS gateway if needed
        let metadataUrl = uri
        if (uri.startsWith('ipfs://')) {
          metadataUrl = `https://ipfs.io/ipfs/${uri.replace('ipfs://', '').replace(/^\/+/, '')}`
        } else if (uri.startsWith('ar://')) {
          // Arweave URLs
          metadataUrl = `https://arweave.net/${uri.replace('ar://', '').replace(/^\/+/, '')}`
        }
        
        // Validate URL format
        try {
          new URL(metadataUrl)
        } catch {
          // Invalid URL, skip fetching
          return {
            name: cleanTokenString(name),
            symbol: cleanTokenString(symbol),
            image: null,
            uri: uri || null
          }
        }
        
        // Fetch with timeout (5 seconds)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        try {
          const response = await fetch(metadataUrl, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json'
            }
          })
          clearTimeout(timeoutId)
          
          if (response.ok) {
            const contentType = response.headers.get('content-type')
            // Only parse as JSON if content-type indicates JSON
            if (contentType && contentType.includes('application/json')) {
              const metadataJson = await response.json()
              image = metadataJson.image || metadataJson.image_uri || null
              
              // If image is IPFS, convert to gateway URL
              if (image && image.startsWith('ipfs://')) {
                image = `https://ipfs.io/ipfs/${image.replace('ipfs://', '').replace(/^\/+/, '')}`
              } else if (image && image.startsWith('ar://')) {
                image = `https://arweave.net/${image.replace('ar://', '').replace(/^\/+/, '')}`
              }
            } else {
              // Not JSON, likely HTML error page - silently skip
              logDebug(`Metadata URI returned non-JSON content: ${metadataUrl}`)
            }
          } else {
            // Response not OK (403, 404, 500, etc.) - silently skip for client errors
            // 403/404 are common for tokens without public metadata, no need to warn
            if (response.status >= 500) {
              // Only log server errors (500+)
              logDebug(`Metadata URI returned status ${response.status}: ${metadataUrl}`)
            }
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId)
          // Silently handle errors - not all tokens have valid metadata URIs
          // Only log unexpected errors (not timeouts, not 404s, not network errors)
          if (fetchErr.name !== 'AbortError' && 
              !fetchErr.message?.includes('Failed to fetch') &&
              !fetchErr.message?.includes('404')) {
            logDebug(`Failed to fetch metadata JSON from ${metadataUrl}:`, fetchErr.message)
          }
        }
      } catch (err) {
        // Silently handle errors - not all tokens have valid metadata URIs
        logDebug(`Error processing metadata URI for ${mintAddress}:`, err.message)
      }
    }
    
    return {
      name: cleanTokenString(name),
      symbol: cleanTokenString(symbol),
      image: image || null,
      uri: uri || null,
      collection: collection || null
    }
  } catch (err) {
    // Only log non-rate-limit errors to reduce console spam
    const isRateLimit = err?.message?.includes('429') || 
                       err?.message?.includes('Too Many Requests') ||
                       err?.code === 429
    
    if (!isRateLimit) {
      logDebug(`Error fetching metadata for ${mintAddress}:`, err.message)
    }
    return null
  }
}

/**
 * Rate limiter utility
 * Ensures requests are spaced out by a minimum delay
 * Handles retries internally for rate limit errors
 */
export class RateLimiter {
  constructor(requestsPerSecond = 2) {
    this.delay = 1000 / requestsPerSecond // 500ms for 2 requests/second (more conservative)
    this.lastRequestTime = 0
    this.queue = []
    this.processing = false
  }

  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject })
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      
      if (timeSinceLastRequest < this.delay) {
        await new Promise(resolve => setTimeout(resolve, this.delay - timeSinceLastRequest))
      }

      const { fn, resolve, reject } = this.queue.shift()
      this.lastRequestTime = Date.now()

      try {
        const result = await fn()
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    this.processing = false
  }
}
