/**
 * Composable for fetching NFTs from wallet that belong to collections
 * Filters wallet NFTs by collection mint addresses
 */

import { ref, computed } from 'vue'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from 'solana-wallets-vue'
import { useSolanaConnection } from './useSolanaConnection'
import { fetchTokenMetadata } from '../utils/metaplex'
import { fetchWalletNFTsFromHelius } from '../utils/heliusNFTs'
import { logError, logDebug } from '../utils/logger'

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
      for (const accountInfo of nftAccounts) {
        try {
          const mintAddress = accountInfo.account.data.parsed.info.mint
          const tokenAmount = accountInfo.account.data.parsed.info.tokenAmount

          // Fetch metadata
          const metadata = await fetchTokenMetadata(connection, mintAddress, true)
          if (metadata) {
            // Check if this NFT belongs to any of the collection mints
            let matchesCollection = false
            
            // Check 1: Direct mint match (for individual NFT mints in collectionMints)
            if (collectionMintAddresses.includes(mintAddress)) {
              matchesCollection = true
              logDebug(`✓ NFT ${mintAddress} matches by direct mint`)
            }
            
            // Check 2: Collection membership (for collection-based matching)
            if (!matchesCollection && metadata.collection) {
              if (collectionMintAddresses.includes(metadata.collection)) {
                matchesCollection = true
                logDebug(`✓ NFT ${mintAddress} belongs to collection ${metadata.collection}`)
              }
            }
            
            if (matchesCollection) {
              nfts.push({
                mint: mintAddress,
                name: metadata.name || '',
                symbol: metadata.symbol || '',
                image: metadata.image,
                decimals: 0,
                balance: tokenAmount.uiAmount,
                balanceRaw: tokenAmount.amount,
                uri: metadata.uri,
                isCollectionItem: true,
                fetchingType: 'NFT',
                collection: metadata.collection || null
              })
            }
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
  const { publicKey, connected } = useWallet()

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
