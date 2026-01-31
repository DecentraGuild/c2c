/**
 * Utility to discover collection mint addresses from individual NFT mints
 * This helps when collection JSONs only have individual NFT mints, not the collection mint
 */

import { PublicKey } from '@solana/web3.js'
import { useSolanaConnection } from '../composables/useSolanaConnection'
import { logDebug, logError } from './logger'

const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

/**
 * Discover the collection mint address from an individual NFT mint
 * @param {string} nftMintAddress - Individual NFT mint address
 * @returns {Promise<string|null>} Collection mint address or null if not found
 */
export async function discoverCollectionMint(nftMintAddress) {
  try {
    logDebug(`Discovering collection mint for NFT: ${nftMintAddress}`)
    
    const connection = useSolanaConnection()
    
    // Get metadata PDA for this NFT
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        new PublicKey(nftMintAddress).toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )

    // Fetch metadata account
    const metadataAccount = await connection.getAccountInfo(metadataPDA)
    if (!metadataAccount) {
      logDebug(`No metadata account found for NFT ${nftMintAddress}`)
      return null
    }

    // Parse metadata to find collection
    const data = metadataAccount.data
    let offset = 1 + 32 + 32 // Skip key, update authority, mint
    
    // Skip name
    const nameLength = data.readUInt32LE(offset)
    offset += 4 + nameLength
    
    // Skip symbol
    const symbolLength = data.readUInt32LE(offset)
    offset += 4 + symbolLength
    
    // Skip URI
    const uriLength = data.readUInt32LE(offset)
    offset += 4 + uriLength
    
    // Skip seller fee (2 bytes)
    offset += 2
    
    // Skip creators
    const creatorsOption = data.readUInt8(offset)
    offset += 1
    if (creatorsOption === 1) {
      const creatorsLength = data.readUInt32LE(offset)
      offset += 4
      offset += creatorsLength * 34
    }
    
    // Read collection option (1 byte)
    const collectionOption = data.readUInt8(offset)
    offset += 1
    
    if (collectionOption === 1) {
      const collectionMint = new PublicKey(data.slice(offset, offset + 32)).toString()
      logDebug(`✓ Discovered collection mint: ${collectionMint} from NFT ${nftMintAddress}`)
      return collectionMint
    }
    
    logDebug(`NFT ${nftMintAddress} has no collection set`)
    return null
  } catch (err) {
    logError(`Failed to discover collection mint for NFT ${nftMintAddress}:`, err)
    return null
  }
}

/**
 * Discover collection mint from Helius DAS API (faster and more reliable)
 * @param {string} nftMintAddress - Individual NFT mint address
 * @returns {Promise<string|null>} Collection mint address or null if not found
 */
export async function discoverCollectionMintFromHelius(nftMintAddress) {
  try {
    const apiKey = import.meta.env.VITE_HELIUS_API_KEY
    if (!apiKey) {
      logDebug('Helius API key not configured, skipping Helius discovery')
      return null
    }

    const rpcUrl = import.meta.env.VITE_HELIUS_RPC || ''
    const isDevnet = rpcUrl.includes('devnet')
    const heliusRpcUrl = isDevnet 
      ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
      : `https://mainnet.helius-rpc.com/?api-key=${apiKey}`

    logDebug(`Fetching NFT metadata from Helius DAS to discover collection: ${nftMintAddress}`)
    
    // Use DAS API getAsset method
    const rpcRequest = {
      jsonrpc: '2.0',
      id: 'helius-das-asset',
      method: 'getAsset',
      params: {
        id: nftMintAddress
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
      logDebug(`Helius DAS API request failed: ${response.status}`)
      return null
    }

    const data = await response.json()
    
    if (data.error || !data.result) {
      logDebug(`Helius DAS API error: ${data.error?.message || 'No result'}`)
      return null
    }

    const asset = data.result
    
    // Check grouping field for collection
    const grouping = asset.grouping || []
    if (Array.isArray(grouping)) {
      const collectionGroup = grouping.find(g => g.group_key === 'collection')
      if (collectionGroup && collectionGroup.group_value) {
        logDebug(`✓ Discovered collection mint from Helius DAS: ${collectionGroup.group_value}`)
        return collectionGroup.group_value
      }
    }
    
    logDebug(`NFT ${nftMintAddress} has no collection in grouping`)
    return null
  } catch (err) {
    logDebug(`Helius DAS discovery failed for ${nftMintAddress}:`, err.message)
    return null
  }
}

/**
 * Discover collection mint from the first NFT in collectionMints array
 * Tries Helius first, then falls back to RPC
 * @param {Array} collectionMints - Array of collection item objects with mint addresses
 * @returns {Promise<string|null>} Collection mint address or null if not found
 */
export async function discoverCollectionMintFromCollectionItems(collectionMints) {
  if (!collectionMints || collectionMints.length === 0) {
    return null
  }

  // Find first NFT item (not token)
  const firstNFTItem = collectionMints.find(item => 
    typeof item === 'object' && 
    item.mint && 
    (item.fetchingType === 'NFT' || item.itemType === 'NFT')
  )

  if (!firstNFTItem) {
    logDebug('No NFT items found in collectionMints to discover collection mint')
    return null
  }

  logDebug(`Attempting to discover collection mint from NFT item: ${firstNFTItem.mint}`)

  // Try Helius first (faster)
  const heliusCollectionMint = await discoverCollectionMintFromHelius(firstNFTItem.mint)
  if (heliusCollectionMint) {
    return heliusCollectionMint
  }

  // Fallback to RPC
  const rpcCollectionMint = await discoverCollectionMint(firstNFTItem.mint)
  return rpcCollectionMint
}
