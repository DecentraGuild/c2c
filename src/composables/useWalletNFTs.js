/**
 * Composable for fetching NFTs from wallet that belong to collections
 * Filters wallet NFTs by collection mint addresses
 */

import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { PublicKey } from '@solana/web3.js'
import { useWalletStore } from '@/stores/wallet'
import { useSolanaConnection } from './useSolanaConnection'
import { fetchTokenMetadata } from '@/utils/metaplex'
import { fetchWalletNFTsFromHelius } from '@/utils/heliusNFTs'
import { logError, logDebug } from '@/utils/logger'

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

/**
 * Fetch NFTs from wallet that match collection item mints
 * Uses multiple methods: Metaplex SDK, Helius API, then RPC fallback
 * @param {string} walletAddress - Wallet address
 * @param {Array<string>} collectionMintAddresses - Array of collection/item mint addresses
 * @returns {Promise<Array>} Array of NFT objects with mint, name, symbol, image, etc.
 */
export async function fetchWalletNFTsByCollection(walletAddress, collectionMintAddresses) {
  try {
    // Try Helius API first (faster and more reliable)
    try {
      const heliusNFTs = await fetchWalletNFTsFromHelius(walletAddress, collectionMintAddresses)
      if (heliusNFTs && heliusNFTs.length > 0) {
        logDebug(`Successfully fetched ${heliusNFTs.length} NFTs from Helius API`)
        return heliusNFTs
      }
      logDebug('Helius API returned no NFTs, trying fallback methods')
    } catch (heliusErr) {
      logDebug('[DEBUG] Helius API unavailable, trying Metaplex SDK:', heliusErr.message)
    }
    
    // Fallback to RPC method (more reliable than Metaplex SDK for wallet NFTs)
    try {
      const connection = useSolanaConnection()
      const nfts = []
      
      logDebug('Fetching token accounts from RPC...')
      
      // Get all token accounts for the wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        }
      )

      logDebug(`Found ${tokenAccounts.value.length} total token accounts`)

      // Filter for NFTs (0 decimals, balance > 0)
      const nftAccounts = tokenAccounts.value.filter(account => {
        const tokenAmount = account.account.data.parsed.info.tokenAmount
        return tokenAmount.decimals === 0 && tokenAmount.uiAmount > 0
      })

      logDebug(`Found ${nftAccounts.length} NFT accounts (0 decimals)`)

      // Fetch metadata for each NFT and filter by collection
      logDebug(`Checking ${nftAccounts.length} NFTs against ${collectionMintAddresses.length} collection mints:`, collectionMintAddresses)
      
      for (const accountInfo of nftAccounts) {
        try {
          const mintAddress = accountInfo.account.data.parsed.info.mint
          const tokenAmount = accountInfo.account.data.parsed.info.tokenAmount

          // Check if this NFT matches by direct mint first (before fetching metadata)
          // This allows us to include NFTs even if metadata fetch fails
          let matchesCollection = false
          let collectionMatchType = null
          
          // Check 1: Direct mint match (for individual NFT mints in collectionMints)
          if (collectionMintAddresses.includes(mintAddress)) {
            matchesCollection = true
            collectionMatchType = 'direct'
            logDebug(`✓ NFT ${mintAddress} matches by direct mint`)
          }

          // Fetch metadata (even if we already matched, we need it for display)
          let metadata = null
          try {
            metadata = await fetchTokenMetadata(connection, mintAddress, true)
            if (metadata) {
              logDebug(`Fetched metadata for ${mintAddress}: name=${metadata.name}, collection=${metadata.collection || 'none'}`)
            }
          } catch (metadataErr) {
            // Metadata fetch failed - this is OK, we can still use the NFT if it matches
            logDebug(`Metadata fetch failed for ${mintAddress} (will still check if matches):`, metadataErr.message)
          }
          
          // Check 2: Collection membership (for collection-based matching)
          // Only check if we haven't already matched and metadata was fetched successfully
          if (!matchesCollection && metadata && metadata.collection) {
            const collectionMatch = collectionMintAddresses.find(cm => cm === metadata.collection)
            if (collectionMatch) {
              matchesCollection = true
              collectionMatchType = 'collection'
              logDebug(`✓ NFT ${mintAddress} belongs to collection ${metadata.collection}`)
            } else {
              logDebug(`✗ NFT ${mintAddress} collection ${metadata.collection} doesn't match any collection mints`)
            }
          }
          
          // Add NFT if it matches (even if metadata fetch failed for direct matches)
          if (matchesCollection) {
            nfts.push({
              mint: mintAddress,
              name: metadata?.name || `NFT ${mintAddress.slice(0, 8)}...`,
              symbol: metadata?.symbol || '',
              image: metadata?.image || null,
              decimals: 0,
              balance: tokenAmount.uiAmount,
              balanceRaw: tokenAmount.amount,
              uri: metadata?.uri || null,
              isCollectionItem: true,
              fetchingType: 'NFT',
              collection: metadata?.collection || (collectionMatchType === 'direct' ? collectionMintAddresses[0] : null)
            })
            logDebug(`Added NFT to list: ${mintAddress}`)
          } else {
            logDebug(`✗ NFT ${mintAddress} does not match any collection mints`)
          }
        } catch (err) {
          logDebug(`Failed to process NFT ${accountInfo.account.data.parsed.info.mint}:`, err)
        }
      }
      
      logDebug(`RPC method found ${nfts.length} matching NFTs`)
      return nfts
    } catch (rpcErr) {
      logError('RPC method failed:', rpcErr)
    }
    
    // Last resort: Try Metaplex SDK
    try {
      logDebug('Trying Metaplex SDK as last resort...')
      const { Metadata } = await import('@metaplex-foundation/mpl-token-metadata')
      const connection = useSolanaConnection()
      
      const nftsMetadata = await Metadata.findDataByOwner(connection, new PublicKey(walletAddress))
      
      logDebug(`Metaplex SDK found ${nftsMetadata.length} NFTs`)
      
      if (nftsMetadata.length > 0) {
        // Filter by collection/item mints
        const filteredNFTs = nftsMetadata.filter(metadata => {
          const mint = metadata.mint?.toString()
          const collection = metadata.collection?.key?.toString()
          
          // Match by mint or collection
          return mint && (
            collectionMintAddresses.includes(mint) ||
            (collection && collectionMintAddresses.includes(collection))
          )
        })
        
        logDebug(`Filtered to ${filteredNFTs.length} matching NFTs`)
        
        // Format Metaplex metadata to our standard format
        const formattedNFTs = filteredNFTs.map(metadata => ({
          mint: metadata.mint?.toString() || '',
          name: metadata.name || '',
          symbol: metadata.symbol || '',
          image: null, // Will be fetched from URI if needed
          decimals: 0,
          balance: 1,
          balanceRaw: '1',
          uri: metadata.uri || null,
          isCollectionItem: true,
          fetchingType: 'NFT',
          collection: metadata.collection?.key?.toString() || null
        }))
        
        // Fetch images from URIs in parallel (optional, can be lazy-loaded)
        const nftsWithImages = await Promise.all(
          formattedNFTs.map(async (nft) => {
            if (nft.uri && !nft.image) {
              try {
                let metadataUrl = nft.uri
                if (nft.uri.startsWith('ipfs://')) {
                  metadataUrl = `https://ipfs.io/ipfs/${nft.uri.replace('ipfs://', '')}`
                } else if (nft.uri.startsWith('ar://')) {
                  metadataUrl = `https://arweave.net/${nft.uri.replace('ar://', '')}`
                }
                
                const metadataResponse = await fetch(metadataUrl)
                if (metadataResponse.ok) {
                  const metadataJson = await metadataResponse.json()
                  nft.image = metadataJson.image || metadataJson.image_url || null
                }
              } catch (err) {
                // Silently fail - image will be loaded later if needed
              }
            }
            return nft
          })
        )
        
        return nftsWithImages
      }
    } catch (metaplexErr) {
      logError('Metaplex SDK failed:', metaplexErr)
    }

    // If all methods fail, return empty array
    logDebug('All NFT fetching methods failed, returning empty array')
    return []
  } catch (err) {
    logError(`Failed to fetch wallet NFTs:`, err)
    // Don't throw, return empty array to allow UI to continue
    return []
  }
}

/**
 * Composable for fetching wallet NFTs by collection
 * @param {Object} collection - Collection object with collectionMints array
 * @returns {Object} Composable functions and state
 */
export function useWalletNFTs(collection) {
  const nfts = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { publicKey, connected } = storeToRefs(useWalletStore())

  /**
   * Fetch NFTs from wallet that match collection mints with fetchingType === 'NFT'
   * Filters wallet NFTs to only include those whose mint addresses match collectionMints
   */
  const fetchWalletNFTs = async () => {
    // Unwrap ref/computed if needed
    const collectionValue = collection?.value || collection
    
    if (!connected.value || !publicKey.value || !collectionValue || !collectionValue.collectionMints) {
      nfts.value = []
      return []
    }

    loading.value = true
    error.value = null
    nfts.value = []

    try {
      const collectionMints = collectionValue.collectionMints || []
      const nftCollectionMints = collectionMints.filter(
        item => typeof item === 'object' && item.fetchingType === 'NFT'
      )

      if (nftCollectionMints.length === 0) {
        loading.value = false
        return []
      }

      // Collect all collection item mint addresses (individual NFT mints)
      const collectionMintAddresses = nftCollectionMints.map(item => item.mint)
      
      // Fetch wallet NFTs that match these mint addresses
      const walletNFTs = await fetchWalletNFTsByCollection(
        publicKey.value.toString(),
        collectionMintAddresses
      )

      nfts.value = walletNFTs
      return walletNFTs
    } catch (err) {
      error.value = err.message || 'Failed to fetch wallet NFTs'
      logError('Error fetching wallet NFTs:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    nfts: computed(() => nfts.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    fetchWalletNFTs
  }
}
