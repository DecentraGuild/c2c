/**
 * Helius NFT API utilities
 * Uses Helius API for efficient NFT fetching
 */

import { logError, logDebug } from './logger'
import { SEARCH_LIMITS, BATCH_SIZES } from './constants/ui'

/**
 * Get Helius API key from environment
 */
function getHeliusApiKey() {
  const env = import.meta.env
  return env.VITE_HELIUS_API_KEY || null
}

/**
 * Get Helius API base URL
 */
function getHeliusApiUrl() {
  const apiKey = getHeliusApiKey()
  if (!apiKey) {
    throw new Error('VITE_HELIUS_API_KEY is not set')
  }
  
  // Determine network from RPC URL or default to mainnet
  const rpcUrl = import.meta.env.VITE_HELIUS_RPC || ''
  const isDevnet = rpcUrl.includes('devnet')
  
  return isDevnet 
    ? `https://api-devnet.helius.xyz/v0`
    : `https://api.helius.xyz/v0`
}

/**
 * Fetch NFTs from wallet using Helius API
 * @param {string} walletAddress - Wallet address
 * @param {Array<string>} collectionMints - Array of collection/item mint addresses to filter by
 * @returns {Promise<Array>} Array of NFT objects
 */
export async function fetchWalletNFTsFromHelius(walletAddress, collectionMints = []) {
  try {
    const apiKey = getHeliusApiKey()
    if (!apiKey) {
      throw new Error('Helius API key not configured')
    }

    const apiUrl = getHeliusApiUrl()
    const url = `${apiUrl}/addresses/${walletAddress}/nfts?api-key=${apiKey}`
    
    logDebug(`Fetching NFTs for wallet: ${walletAddress}`)
    
    const response = await fetch(url)
    if (!response.ok) {
      const errorText = await response.text()
      logError(`Helius API error ${response.status}: ${errorText}`)
      throw new Error(`Helius API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    // Helius API can return data in different formats
    const allNFTs = data.nfts || data || []
    
    if (!Array.isArray(allNFTs)) {
      logDebug(`Helius API returned non-array data`)
      return []
    }

    logDebug(`Returned ${allNFTs.length} NFTs for wallet`)

    // Filter NFTs by collection/item mints if provided
    if (collectionMints.length > 0) {
      logDebug(`Filtering NFTs by ${collectionMints.length} collection item mints:`, collectionMints)
      
      const filteredNFTs = allNFTs.filter(nft => {
        // Handle different Helius response formats
        const nftMint = nft.mint || nft.id || nft.tokenAddress || nft.token_address
        
        if (!nftMint) {
          logDebug('NFT missing mint address:', nft)
          return false
        }
        
        // Check if NFT mint matches any collection item mint directly
        if (collectionMints.includes(nftMint)) {
          logDebug(`✓ NFT ${nftMint} matches collection item mint directly`)
          return true
        }
        
        // Check if NFT belongs to a collection that matches any collection item mint
        // Helius uses 'grouping' array or 'collection' field
        const grouping = nft.grouping || nft.groupings || []
        if (Array.isArray(grouping) && grouping.length > 0) {
          for (const group of grouping) {
            if (group.group_key === 'collection' || group.groupKey === 'collection') {
              const collectionMint = group.group_value || group.groupValue
              if (collectionMint && collectionMints.includes(collectionMint)) {
                logDebug(`✓ NFT ${nftMint} belongs to collection ${collectionMint} which matches collection item`)
                return true
              }
            }
          }
        }
        
        // Also check direct collection field
        if (nft.collection && collectionMints.includes(nft.collection)) {
          logDebug(`✓ NFT ${nftMint} has collection field ${nft.collection} which matches collection item`)
          return true
        }
        
        return false
      })

      logDebug(`Filtered ${allNFTs.length} NFTs → ${filteredNFTs.length} matching collection items`)
      return filteredNFTs.map(formatHeliusNFT)
    }

    return allNFTs.map(formatHeliusNFT)
  } catch (err) {
    logError('Failed to fetch NFTs from Helius:', err)
    throw err
  }
}

/**
 * Fetch NFTs by creator address using Helius API
 * Uses Helius REST API /mints endpoint with creator filter
 * @param {string} creatorAddress - Creator wallet address
 * @returns {Promise<Array>} Array of NFT objects
 */
export async function fetchNFTsByCreatorFromHelius(creatorAddress) {
  try {
    const apiKey = getHeliusApiKey()
    if (!apiKey) {
      throw new Error('Helius API key not configured')
    }

    const apiUrl = getHeliusApiUrl()
    
    logDebug(`Fetching NFTs by creator: ${creatorAddress}`)
    
    // Use Helius REST API /mints endpoint with creator filter
    const url = `${apiUrl}/mints?api-key=${apiKey}&creator=${creatorAddress}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      logDebug(`Helius REST API error ${response.status}, trying DAS API fallback`)
      return await fetchNFTsByCreatorDAS(creatorAddress)
    }

    const data = await response.json()
    const mints = data.mints || data || []
    
    if (!Array.isArray(mints)) {
      logDebug(`Helius REST unexpected response format, trying DAS API fallback`)
      return await fetchNFTsByCreatorDAS(creatorAddress)
    }
    
    // Fetch full NFT data for each mint using DAS API getAsset
    const allNFTs = []
    
    for (let i = 0; i < mints.length; i += BATCH_SIZES.NFT_METADATA_FETCH) {
      const batch = mints.slice(i, i + BATCH_SIZES.NFT_METADATA_FETCH)
      const nftPromises = batch.map(mint => fetchNFTByMint(mint))
      const batchNFTs = await Promise.all(nftPromises)
      allNFTs.push(...batchNFTs.filter(nft => nft !== null))
    }

    logDebug(`Total NFTs fetched by creator: ${allNFTs.length}`)
    return allNFTs
  } catch (err) {
    logError(`Failed to fetch NFTs by creator:`, err)
    // Try DAS API as fallback
    return await fetchNFTsByCreatorDAS(creatorAddress)
  }
}

/**
 * Fallback: Fetch NFTs by creator using DAS API searchAssets
 */
async function fetchNFTsByCreatorDAS(creatorAddress) {
  try {
    const apiKey = getHeliusApiKey()
    const rpcUrl = import.meta.env.VITE_HELIUS_RPC || ''
    const isDevnet = rpcUrl.includes('devnet')
    const heliusRpcUrl = isDevnet 
      ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
      : `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
    
    logDebug(`Trying DAS API searchAssets with creator filter`)
    
    const rpcRequest = {
      jsonrpc: '2.0',
      id: 'helius-das-creator',
      method: 'searchAssets',
      params: {
        creatorAddress: creatorAddress,
        page: 1,
        limit: 1000
      }
    }

    const response = await fetch(heliusRpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rpcRequest)
    })

    if (!response.ok) {
      throw new Error(`DAS API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`DAS API error: ${data.error.message}`)
    }

    const result = data.result
    if (!result || !result.items) {
      return []
    }

    const items = result.items || []
    logDebug(`Found ${items.length} NFTs by creator via DAS API`)
    
    return items.map(formatDASNFT)
  } catch (err) {
    logDebug(`DAS API creator search failed: ${err.message}`)
    return []
  }
}

/**
 * Fetch single NFT by mint address using DAS API
 */
async function fetchNFTByMint(mintAddress) {
  try {
    const apiKey = getHeliusApiKey()
    const rpcUrl = import.meta.env.VITE_HELIUS_RPC || ''
    const isDevnet = rpcUrl.includes('devnet')
    const heliusRpcUrl = isDevnet 
      ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
      : `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
    
    const rpcRequest = {
      jsonrpc: '2.0',
      id: 'helius-das-asset',
      method: 'getAsset',
      params: {
        id: mintAddress
      }
    }

    const response = await fetch(heliusRpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rpcRequest)
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.error || !data.result) {
      return null
    }

    return formatDASNFT(data.result)
  } catch (err) {
    return null
  }
}

/**
 * Fetch NFTs from a collection using Helius API
 * Supports both collection mint and creator address
 * Uses Helius DAS (Digital Asset Standard) API
 * @param {string} collectionMint - Collection mint address (Metaplex collection mint) OR creator address
 * @param {Object} options - Options object
 * @param {boolean} options.byCreator - If true, treat collectionMint as creator address
 * @returns {Promise<Array>} Array of NFT objects
 */
export async function fetchCollectionNFTsFromHelius(collectionMint, options = {}) {
  // If fetching by creator, use the creator-specific function
  if (options.byCreator) {
    return await fetchNFTsByCreatorFromHelius(collectionMint)
  }

  try {
    const apiKey = getHeliusApiKey()
    if (!apiKey) {
      throw new Error('Helius API key not configured')
    }

    // Determine network from RPC URL
    const rpcUrl = import.meta.env.VITE_HELIUS_RPC || ''
    const isDevnet = rpcUrl.includes('devnet')
    const heliusRpcUrl = isDevnet 
      ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
      : `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
    
    logDebug(`Fetching NFTs from collection: ${collectionMint}`)
    
    // Use DAS API getAssetsByGroup method via RPC
    const allNFTs = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const rpcRequest = {
        jsonrpc: '2.0',
        id: 'helius-das',
        method: 'getAssetsByGroup',
        params: {
          groupKey: 'collection',
          groupValue: collectionMint,
          page: page,
          limit: 1000 // DAS API supports up to 1000 items per page
        }
      }

      const response = await fetch(heliusRpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rpcRequest)
      })

      if (!response.ok) {
        const errorText = await response.text()
        logError(`DAS API RPC error ${response.status}: ${errorText}`)
        throw new Error(`Helius DAS API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        logError(`DAS API RPC error: ${data.error.message || JSON.stringify(data.error)}`)
        throw new Error(`Helius DAS API error: ${data.error.message || JSON.stringify(data.error)}`)
      }

      const result = data.result
      if (!result || !result.items) {
        logDebug(`DAS API unexpected response format`)
        break
      }

      const items = result.items || []
      logDebug(`Page ${page}: Retrieved ${items.length} NFTs`)

      // Format and add NFTs
      const formattedNFTs = items.map(formatDASNFT)
      allNFTs.push(...formattedNFTs)

      // Check if there are more pages
      hasMore = result.total > allNFTs.length && items.length === 1000
      page++

      // Safety limit: don't fetch more than 10,000 NFTs
        if (allNFTs.length >= SEARCH_LIMITS.NFT_FETCH_LIMIT) {
        logDebug(`Reached safety limit of ${SEARCH_LIMITS.NFT_FETCH_LIMIT} NFTs. Stopping pagination.`)
        break
      }
    }

    logDebug(`Total NFTs fetched: ${allNFTs.length}`)
    return allNFTs
  } catch (err) {
    logError('Failed to fetch collection NFTs from Helius DAS API:', err)
    return []
  }
}

/**
 * Format DAS API asset response to our standard format
 * DAS API returns assets in a different format than the REST API
 */
function formatDASNFT(dasAsset) {
  // DAS API asset structure
  const id = dasAsset.id || dasAsset.mint || ''
  const content = dasAsset.content || {}
  const metadata = content.metadata || {}
  const json = content.json || {}
  const files = content.files || []
  
  // Extract image (following Helius DAS structure)
  // Priority: files[0].uri > json.image > metadata.image > content.image
  let image = null
  if (files && files.length > 0) {
    image = files[0]?.uri || files[0]?.cdn_uri || null
  }
  if (!image) {
    image = json.image || metadata.image || content.image || null
  }
  
  // Extract collection info from grouping
  const grouping = dasAsset.grouping || []
  const collectionGroup = Array.isArray(grouping) 
    ? grouping.find(g => g.group_key === 'collection')
    : null
  const collectionMint = collectionGroup?.group_value || null
  
  return {
    mint: id,
    name: metadata.name || dasAsset.name || '',
    symbol: metadata.symbol || dasAsset.symbol || '',
    image: image,
    decimals: 0,
    balance: 1, // NFTs are always 1
    balanceRaw: '1',
    uri: content.json_uri || content.uri || metadata.uri || null,
    isCollectionItem: true,
    fetchingType: 'NFT',
    attributes: json.attributes || metadata.attributes || [],
    collection: collectionMint,
    // Store ownership and compression info for future use
    owner: dasAsset.ownership?.owner || null,
    compressed: dasAsset.compression?.compressed ?? false
  }
}

/**
 * Format Helius NFT response to our standard format
 */
function formatHeliusNFT(heliusNFT) {
  // Handle different Helius API response formats
  const mint = heliusNFT.mint || heliusNFT.id || heliusNFT.tokenAddress || heliusNFT.token_address
  const content = heliusNFT.content || heliusNFT.metadata || {}
  const metadata = content.metadata || content || {}
  const files = content.files || (content.image ? [{ uri: content.image }] : [])
  
  // Extract image from various possible locations
  let image = null
  if (files && files.length > 0) {
    image = files[0]?.uri || files[0]?.cdn_uri || files[0]?.cdnUri
  }
  if (!image) {
    image = metadata.image || content.image || heliusNFT.image || heliusNFT.cdn_image || null
  }
  
  // Extract collection info
  const grouping = heliusNFT.grouping || heliusNFT.groupings || []
  const collectionGroup = Array.isArray(grouping) 
    ? grouping.find(g => (g.group_key === 'collection' || g.groupKey === 'collection'))
    : null
  const collectionMint = collectionGroup?.group_value || collectionGroup?.groupValue || heliusNFT.collection || null
  
  return {
    mint: mint,
    name: metadata.name || heliusNFT.name || '',
    symbol: metadata.symbol || heliusNFT.symbol || '',
    image: image,
    decimals: 0,
    balance: heliusNFT.amount || heliusNFT.tokenAmount?.amount || heliusNFT.token_amount?.amount || 1,
    balanceRaw: (heliusNFT.amount || heliusNFT.tokenAmount?.amount || heliusNFT.token_amount?.amount || 1).toString(),
    uri: content.json_uri || content.jsonUri || content.uri || heliusNFT.uri || null,
    isCollectionItem: true,
    fetchingType: 'NFT',
    // Preserve additional Helius data
    attributes: metadata.attributes || [],
    collection: collectionMint
  }
}
