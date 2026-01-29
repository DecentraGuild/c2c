/**
 * Composable for fetching NFTs from a collection mint address
 * Uses Metaplex Token Metadata program to find all NFTs in a collection
 */

import { ref, computed } from 'vue'
import { PublicKey } from '@solana/web3.js'
import { useSolanaConnection } from './useSolanaConnection'
import { fetchTokenMetadata } from '../utils/metaplex'
import { fetchCollectionNFTsFromHelius } from '../utils/heliusNFTs'
import { logError, logDebug } from '../utils/logger'

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

/**
 * Fetch all NFTs from a collection mint address
 * Uses Metaplex Token Metadata program to find NFTs that belong to a collection
 * @param {string} collectionMintAddress - The collection mint address
 * @returns {Promise<Array>} Array of NFT objects with mint, name, symbol, image, etc.
 */
export async function fetchNFTsFromCollection(collectionMintAddress, options = {}) {
  // Try Helius API first (much faster and more reliable)
  try {
    const heliusNFTs = await fetchCollectionNFTsFromHelius(collectionMintAddress, options)
    if (heliusNFTs.length > 0) {
      logDebug(`Helius returned ${heliusNFTs.length} NFTs for collection ${collectionMintAddress}`)
      return heliusNFTs
    }
  } catch (heliusErr) {
    logDebug('Helius API unavailable for collection fetch, falling back to RPC method:', heliusErr.message)
    // Fall through to RPC method
  }

  // Fallback: Note that fetching all NFTs from a collection via RPC is very slow
  // This is a simplified approach - in production, use Helius or another indexing service
  const connection = useSolanaConnection()
  const collectionMint = new PublicKey(collectionMintAddress)
  const nfts = []
  
  try {
    // Get the collection metadata PDA
    const [collectionMetadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )

    // Find all metadata accounts that reference this collection
    // The collection field in metadata is at offset after URI field
    // Metaplex metadata structure:
    // - 1 byte: key
    // - 32 bytes: update authority
    // - 32 bytes: mint
    // - 4 bytes + name string
    // - 4 bytes + symbol string
    // - 4 bytes + URI string
    // - 2 bytes: seller fee basis points
    // - 1 byte: creators option (1 = Some, 0 = None)
    // - ... creators data
    // - 1 byte: collection option (1 = Some, 0 = None)
    // - 32 bytes: collection mint (if collection option = 1)
    // - 1 byte: uses option
    // - ... uses data
    
    // We need to find metadata accounts where collection field matches our collection mint
    // This is complex to do with getProgramAccounts filters, so we'll use a different approach:
    // Get all metadata accounts and filter by collection field
    
    // Note: For large collections, this might be slow. Consider using an indexing service
    // like Helius, QuickNode, or The Graph in production
    
    // For now, we'll get program accounts and filter manually
    // This is a simplified approach - in production, use an indexing service
    const allMetadataAccounts = await connection.getProgramAccounts(
      TOKEN_METADATA_PROGRAM_ID,
      {
        filters: [
          {
            dataSize: 679, // Standard metadata account size (can vary, but this is common)
          },
        ],
      }
    )

    logDebug(`Found ${allMetadataAccounts.length} metadata accounts, filtering for collection ${collectionMintAddress}`)

    // Process each metadata account and filter by collection
    for (const { account, pubkey } of allMetadataAccounts) {
      try {
        const data = account.data
        let offset = 1 + 32 + 32 // Skip key, update authority, mint

        // Read name
        const nameLength = data.readUInt32LE(offset)
        offset += 4
        const name = data.slice(offset, offset + nameLength).toString('utf8')
        offset += nameLength

        // Read symbol
        const symbolLength = data.readUInt32LE(offset)
        offset += 4
        const symbol = data.slice(offset, offset + symbolLength).toString('utf8')
        offset += symbolLength

        // Read URI
        const uriLength = data.readUInt32LE(offset)
        offset += 4
        const uri = data.slice(offset, offset + uriLength).toString('utf8').trim()
        offset += uriLength

        // Read seller fee basis points (2 bytes)
        offset += 2

        // Read creators option (1 byte)
        const creatorsOption = data.readUInt8(offset)
        offset += 1

        // Skip creators if present
        if (creatorsOption === 1) {
          const creatorsLength = data.readUInt32LE(offset)
          offset += 4
          // Each creator is 32 + 1 + 1 = 34 bytes (pubkey + verified + share)
          offset += creatorsLength * 34
        }

        // Read collection option (1 byte)
        const collectionOption = data.readUInt8(offset)
        offset += 1

        // Check if this NFT belongs to our collection
        if (collectionOption === 1) {
          const nftCollectionMint = new PublicKey(data.slice(offset, offset + 32))
          
          // Only include if it matches our collection mint
          if (!nftCollectionMint.equals(collectionMint)) {
            continue // Skip this NFT, it belongs to a different collection
          }
        } else {
          // No collection set, skip
          continue
        }

        // Read mint address (it's at offset 1 + 32)
        const mintOffset = 1 + 32
        const mintPubkey = new PublicKey(data.slice(mintOffset, mintOffset + 32))

        // Fetch metadata from URI to get image
        let image = null
        if (uri && uri.length > 0 && !uri.startsWith('http://localhost')) {
          try {
            let metadataUrl = uri
            if (uri.startsWith('ipfs://')) {
              metadataUrl = `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`
            } else if (uri.startsWith('ar://')) {
              metadataUrl = `https://arweave.net/${uri.replace('ar://', '')}`
            }

            const metadataResponse = await fetch(metadataUrl)
            if (metadataResponse.ok) {
              const metadataJson = await metadataResponse.json()
              image = metadataJson.image || metadataJson.image_url || null
            }
          } catch (err) {
            logDebug(`Failed to fetch metadata from URI ${uri}:`, err)
          }
        }

        nfts.push({
          mint: mintPubkey.toString(),
          name: name || '',
          symbol: symbol || '',
          image: image,
          decimals: 0, // NFTs have 0 decimals
          uri: uri,
          isCollectionItem: true
        })
      } catch (err) {
        logDebug(`Failed to parse NFT metadata for ${pubkey.toString()}:`, err)
      }
    }

    logDebug(`Successfully fetched ${nfts.length} NFTs from collection ${collectionMintAddress}`)
    return nfts
  } catch (err) {
    logError(`Failed to fetch NFTs from collection ${collectionMintAddress}:`, err)
    throw err
  }
}

/**
 * Composable for fetching NFTs from a collection
 * @param {Object|Ref|ComputedRef} collection - Collection object with collectionMints array (can be a ref/computed)
 * @returns {Object} Composable functions and state
 */
export function useCollectionNFTs(collection) {
  const nfts = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * Fetch all NFTs from a collection using collectionMint
   * Uses collection.collectionMint (Metaplex collection mint) to fetch all NFTs
   */
  const fetchCollectionNFTs = async () => {
    // Unwrap ref/computed if needed
    const collectionValue = collection?.value || collection
    
    if (!collectionValue) {
      return []
    }

    loading.value = true
    error.value = null
    nfts.value = []

    try {
      // Priority 1: Use collectionMint to fetch all NFTs from the collection
      const collectionMint = collectionValue.collectionMint
      
      if (collectionMint) {
        try {
          const collectionNFTs = await fetchNFTsFromCollection(collectionMint)
          nfts.value = collectionNFTs
          loading.value = false
          return collectionNFTs
        } catch (err) {
          error.value = `Failed to fetch NFTs from collection: ${err.message}`
          logError(`Failed to fetch NFTs from collection mint ${collectionMint}:`, err)
          // Fall through to try creator address as backup
        }
      }
      
      // Priority 2: Fallback to creator address if collection mint failed or doesn't exist
      const creatorAddress = collectionValue.creatorAddress
      if (creatorAddress) {
        try {
          const { fetchCollectionNFTsFromHelius } = await import('../utils/heliusNFTs')
          // Use creator address with byCreator option
          const creatorNFTs = await fetchCollectionNFTsFromHelius(creatorAddress, { byCreator: true })
          nfts.value = creatorNFTs
          loading.value = false
          return creatorNFTs
        } catch (err) {
          error.value = `Failed to fetch NFTs by creator: ${err.message}`
          logError(`Failed to fetch NFTs by creator ${creatorAddress}:`, err)
        }
      }
      
      // No collection mint or creator address available
      if (!collectionMint && !creatorAddress) {
        nfts.value = []
        return []
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch collection NFTs'
      logError('Error fetching collection NFTs:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    nfts: computed(() => nfts.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    fetchCollectionNFTs
  }
}
