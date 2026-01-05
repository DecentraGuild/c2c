/**
 * Composable for fetching wallet balances (SOL and SPL tokens)
 */

import { ref, computed, watch } from 'vue'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from 'solana-wallets-vue'
import { NATIVE_SOL } from '../utils/constants'
import { fetchTokenMetadata } from '../utils/metaplex'
import { useSolanaConnection } from './useSolanaConnection'
import { metadataRateLimiter } from '../utils/rateLimiter'
import { cleanTokenString } from '../utils/formatters'

export function useWalletBalances(options = {}) {
  const { autoFetch = true } = options
  const { publicKey, connected } = useWallet()
  const balances = ref([])
  const loading = ref(false)
  const error = ref(null)
  const loadingMetadata = ref(false)

  // Use shared connection
  const connection = useSolanaConnection()

  /**
   * Fetch SOL balance
   */
  const fetchSOLBalance = async (walletAddress) => {
    try {
      const lamports = await connection.getBalance(new PublicKey(walletAddress))
      const solBalance = lamports / 1e9 // Convert lamports to SOL
      
      return {
        mint: NATIVE_SOL.mint,
        symbol: 'SOL',
        name: 'Solana',
        decimals: NATIVE_SOL.decimals,
        balance: solBalance,
        balanceRaw: lamports.toString(),
        isNative: true
      }
    } catch (err) {
      console.error('Error fetching SOL balance:', err)
      return null
    }
  }

  /**
   * Fetch all SPL token balances
   */
  const fetchSPLTokenBalances = async (walletAddress) => {
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        }
      )

      // DEBUG: Only log if debug mode is enabled (via window.debugWalletBalances.debugMode = true)
      if (typeof window !== 'undefined' && window.debugWalletBalances?.debugMode) {
        console.group('🔍 Raw Token Accounts Response')
        console.log('Total token accounts:', tokenAccounts.value.length)
        if (tokenAccounts.value.length > 0) {
          console.log('Sample account structure:', JSON.stringify(tokenAccounts.value[0], null, 2))
          console.log('Available fields in parsedInfo:', Object.keys(tokenAccounts.value[0].account?.data?.parsed?.info || {}))
          console.log('Note: Balance fetch only provides: mint, decimals, balance. No name/symbol/image.')
        }
        console.groupEnd()
      }

      const tokenBalances = []

      for (const accountInfo of tokenAccounts.value) {
        const parsedInfo = accountInfo.account.data.parsed.info
        const mintAddress = parsedInfo.mint
        const tokenAmount = parsedInfo.tokenAmount

        // Only include tokens with non-zero balance
        if (tokenAmount.uiAmount > 0) {
          tokenBalances.push({
            mint: mintAddress,
            symbol: null, // Will be fetched from metadata if needed
            name: null, // Will be fetched from metadata if needed
            decimals: tokenAmount.decimals,
            balance: tokenAmount.uiAmount,
            balanceRaw: tokenAmount.amount,
            isNative: false
          })
        }
      }

      return tokenBalances
    } catch (err) {
      console.error('Error fetching SPL token balances:', err)
      return []
    }
  }

  /**
   * Fetch and update metadata for a single token (no retries, fail fast)
   */
  const fetchAndUpdateTokenMetadata = async (token) => {
    // For native SOL, only fetch the image from wrapped SOL, preserve name/symbol
    if (token.isNative) {
      try {
        const metadata = await metadataRateLimiter.execute(() =>
          fetchTokenMetadata(connection, token.mint, true)
        )

        if (metadata && metadata.image) {
          // Only update the image, keep original name and symbol for SOL
          return {
            ...token,
            image: metadata.image
            // name and symbol stay as "Solana" and "SOL"
          }
        }
      } catch (err) {
        // Silently fail - SOL logo is optional, no retry
        return token
      }
      return token
    }

    // For SPL tokens, fetch full metadata (no retry on failure)
    try {
      const metadata = await metadataRateLimiter.execute(() =>
        fetchTokenMetadata(connection, token.mint)
      )

      if (metadata) {
        return {
          ...token,
          name: cleanTokenString(metadata.name || token.name),
          symbol: cleanTokenString(metadata.symbol || token.symbol),
          image: metadata.image || token.image
        }
      }
    } catch (err) {
      // Silently fail - metadata is optional, no retry
      return token
    }

    return token
  }

  /**
   * Fetch metadata for all tokens asynchronously (don't wait for all)
   * Updates balances array as metadata loads
   */
  const fetchAllTokenMetadata = async (tokens) => {
    // Mark as loading, but don't wait for all metadata
    loadingMetadata.value = true
    
    // Start with tokens without metadata (show immediately)
    const tokensWithMetadata = [...tokens]
    
    // Fetch metadata asynchronously and update as they complete
    // Don't wait for all - update UI as each completes
    tokens.forEach(async (token, index) => {
      try {
        const tokenWithMetadata = await fetchAndUpdateTokenMetadata(token)
        // Update the token in place
        tokensWithMetadata[index] = tokenWithMetadata
        // Trigger reactivity by updating the array
        balances.value = [...tokensWithMetadata]
      } catch (err) {
        // Silently continue - token already has basic info
      }
    })
    
    // Mark metadata loading as complete immediately (don't wait for all)
    // This allows UI to show tokens while metadata loads in background
    setTimeout(() => {
      loadingMetadata.value = false
    }, 100) // Small delay to allow initial metadata fetches to start
    
    return tokensWithMetadata
  }

  /**
   * Fetch all balances (SOL + SPL tokens)
   */
  const fetchBalances = async () => {
    if (!connected.value || !publicKey.value) {
      balances.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const walletAddress = publicKey.value.toString()
      
      // Fetch SOL balance and SPL token balances in parallel
      const [solBalance, splBalances] = await Promise.all([
        fetchSOLBalance(walletAddress),
        fetchSPLTokenBalances(walletAddress)
      ])

      // Combine balances, SOL first
      const allBalances = []
      if (solBalance) {
        allBalances.push(solBalance)
      }
      if (splBalances && splBalances.length > 0) {
        allBalances.push(...splBalances)
      }

      // Set initial balances (without metadata)
      balances.value = allBalances

      // Fetch metadata for all tokens asynchronously (with rate limiting)
      if (allBalances.length > 0) {
        fetchAllTokenMetadata(allBalances).then(tokensWithMetadata => {
          // Update balances with metadata
          balances.value = tokensWithMetadata
        })
      }
    } catch (err) {
      console.error('Error fetching balances:', err)
      // Provide more user-friendly error messages
      if (err.message && err.message.includes('403')) {
        error.value = 'RPC access forbidden. Please check your API key configuration.'
      } else {
        error.value = err.message || 'Failed to fetch balances'
      }
      balances.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get balance for a specific token mint
   */
  const getTokenBalance = (mintAddress) => {
    const token = balances.value.find(t => t.mint === mintAddress)
    return token ? token.balance : 0
  }

  /**
   * Get token info by mint address
   */
  const getTokenInfo = (mintAddress) => {
    return balances.value.find(t => t.mint === mintAddress) || null
  }

  /**
   * Fetch balance for a single specific token mint (without fetching all balances)
   */
  const fetchSingleTokenBalance = async (mintAddress) => {
    if (!connected.value || !publicKey.value) {
      return 0
    }

    try {
      const walletAddress = publicKey.value.toString()
      const mintPublicKey = new PublicKey(mintAddress)

      // Check if it's native SOL
      if (mintAddress === NATIVE_SOL.mint) {
        const solBalance = await fetchSOLBalance(walletAddress)
        if (solBalance) {
          // Update or add to balances array
          const existingIndex = balances.value.findIndex(t => t.mint === mintAddress)
          if (existingIndex >= 0) {
            balances.value[existingIndex] = solBalance
          } else {
            balances.value.push(solBalance)
          }
          return solBalance.balance
        }
        return 0
      }

      // For SPL tokens, get token accounts for this specific mint
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        {
          mint: mintPublicKey
        }
      )

      if (tokenAccounts.value.length === 0) {
        return 0
      }

      // Get the first token account (user should only have one per mint)
      const parsedInfo = tokenAccounts.value[0].account.data.parsed.info
      const tokenAmount = parsedInfo.tokenAmount

      const balance = tokenAmount.uiAmount || 0

      // Update or add to balances array
      const tokenData = {
        mint: mintAddress,
        symbol: null,
        name: null,
        decimals: tokenAmount.decimals,
        balance: balance,
        balanceRaw: tokenAmount.amount,
        isNative: false
      }

      const existingIndex = balances.value.findIndex(t => t.mint === mintAddress)
      if (existingIndex >= 0) {
        balances.value[existingIndex] = tokenData
      } else {
        balances.value.push(tokenData)
      }

      return balance
    } catch (err) {
      console.error(`Error fetching balance for token ${mintAddress}:`, err)
      return 0
    }
  }

  // Watch for wallet connection changes (only if autoFetch is enabled)
  if (autoFetch) {
    watch([connected, publicKey], ([isConnected, pubKey]) => {
      if (isConnected && pubKey) {
        fetchBalances()
      } else {
        balances.value = []
      }
    }, { immediate: true })
  }

  /**
   * DEBUG: Inspect what data is available from a mint account
   * This can help identify if metadata is already available without fetching
   */
  const inspectMintAccount = async (mintAddress) => {
    try {
      console.group(`🔍 Inspecting Mint Account: ${mintAddress}`)
      
      const mintPublicKey = new PublicKey(mintAddress)
      
      // Get parsed account info for the mint
      const accountInfo = await connection.getParsedAccountInfo(mintPublicKey)
      
      console.log('Account Info Structure:', {
        exists: !!accountInfo.value,
        owner: accountInfo.value?.owner?.toString(),
        executable: accountInfo.value?.executable,
        lamports: accountInfo.value?.lamports,
        dataType: accountInfo.value?.data ? (typeof accountInfo.value.data === 'string' ? 'string' : 'parsed' ? 'parsed' : 'buffer') : null,
        dataKeys: accountInfo.value?.data && typeof accountInfo.value.data === 'object' ? Object.keys(accountInfo.value.data) : null
      })
      
      if (accountInfo.value?.data && 'parsed' in accountInfo.value.data) {
        console.log('Parsed Data:', accountInfo.value.data.parsed)
        console.log('Parsed Info Keys:', Object.keys(accountInfo.value.data.parsed.info || {}))
        console.log('Full Parsed Info:', JSON.stringify(accountInfo.value.data.parsed.info, null, 2))
      } else if (accountInfo.value?.data) {
        console.log('Raw Data (not parsed):', accountInfo.value.data)
      }
      
      // Also check what getParsedTokenAccountsByOwner returns for this specific mint
      if (connected.value && publicKey.value) {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey.value,
          { mint: mintPublicKey }
        )
        
        console.log('Token Accounts for this mint:', tokenAccounts.value.length)
        if (tokenAccounts.value.length > 0) {
          console.log('Token Account Structure:', JSON.stringify(tokenAccounts.value[0], null, 2))
        }
      }
      
      console.groupEnd()
      
      return accountInfo
    } catch (err) {
      console.error('Error inspecting mint account:', err)
      console.groupEnd()
      return null
    }
  }

  // Expose debug function to window for easy console access
  if (typeof window !== 'undefined') {
    window.debugWalletBalances = {
      debugMode: false, // Set to true to enable verbose logging
      inspectMintAccount,
      inspectRawResponse: async () => {
        if (connected.value && publicKey.value) {
          console.log('Fetching raw token accounts response...')
          await fetchBalances()
        } else {
          console.warn('Wallet not connected')
        }
      },
      enableDebug: () => {
        window.debugWalletBalances.debugMode = true
        console.log('✅ Debug mode enabled. Balance fetches will show detailed logs.')
      },
      disableDebug: () => {
        window.debugWalletBalances.debugMode = false
        console.log('❌ Debug mode disabled.')
      }
    }
  }

  return {
    balances: computed(() => balances.value),
    loading: computed(() => loading.value),
    loadingMetadata: computed(() => loadingMetadata.value),
    error: computed(() => error.value),
    fetchBalances,
    getTokenBalance,
    getTokenInfo,
    fetchSingleTokenBalance,
    inspectMintAccount // Expose for debugging
  }
}
