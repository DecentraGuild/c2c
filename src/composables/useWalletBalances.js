/**
 * Composable for fetching wallet balances (SOL and SPL tokens)
 */

import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { PublicKey } from '@solana/web3.js'
import { useWalletStore } from '@/stores/wallet'
import { NATIVE_SOL } from '@/utils/constants'
import { fetchTokenMetadata } from '@/utils/metaplex'
import { useSolanaConnection } from './useSolanaConnection'
import { metadataRateLimiter } from '@/utils/rateLimiter'
import { cleanTokenString } from '@/utils/formatters'
import { useTokenStore } from '@/stores/token'
import { logError, logDebug, logWarning } from '@/utils/logger'
import { fetchAllTokenBalancesFromDAS } from '@/utils/heliusDAS'
import { UI_CONSTANTS, BATCH_SIZES } from '@/utils/constants/ui'

const BALANCE_CACHE_TTL_MS = 60 * 1000 // 60 seconds – avoid refetching too often

export function useWalletBalances(options = {}) {
  const { autoFetch = true } = options
  const walletStore = useWalletStore()
  const { publicKey, connected } = storeToRefs(walletStore)
  const balances = ref([])
  const loading = ref(false)
  const error = ref(null)
  const loadingMetadata = ref(false)

  // Cache: skip refetch if same wallet and data is fresh
  let lastBalanceFetchTs = 0
  let lastBalanceFetchWallet = null

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
      logError('Error fetching SOL balance:', err)
      return null
    }
  }

  /**
   * Legacy RPC: fetch SPL token balances via getParsedTokenAccountsByOwner for Token Program
   * and Token-2022. Reliably returns USDC, USDT, and other standard SPL tokens that DAS may omit.
   */
  const fetchSPLTokenBalancesFromRPC = async (walletAddress) => {
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')

    const [standardTokenAccounts, token2022Accounts] = await Promise.all([
      connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { programId: TOKEN_PROGRAM_ID }
      ).catch(() => ({ value: [] })),
      connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { programId: TOKEN_2022_PROGRAM_ID }
      ).catch(() => ({ value: [] }))
    ])

    const allTokenAccounts = [
      ...(standardTokenAccounts.value || []),
      ...(token2022Accounts.value || [])
    ]

    const tokenBalances = []
    for (const accountInfo of allTokenAccounts) {
      const parsedInfo = accountInfo.account?.data?.parsed?.info
      if (!parsedInfo) continue
      const mintAddress = parsedInfo.mint
      const tokenAmount = parsedInfo.tokenAmount
      if (tokenAmount?.uiAmount > 0) {
        tokenBalances.push({
          mint: mintAddress,
          symbol: null,
          name: null,
          decimals: tokenAmount.decimals,
          balance: tokenAmount.uiAmount,
          balanceRaw: tokenAmount.amount,
          isNative: false
        })
      }
    }
    return tokenBalances
  }

  /**
   * Fetch all SPL token balances from the wallet.
   * Uses both DAS (getAssetsByOwner) and legacy RPC (getParsedTokenAccountsByOwner for Token +
   * Token-2022) in parallel, then merges by mint. RPC ensures USDC, USDT, RRR and other standard
   * SPL tokens are always found; DAS adds assets from other programs and enriches metadata.
   */
  const fetchSPLTokenBalances = async (walletAddress) => {
    try {
      const [dasBalances, rpcBalances] = await Promise.all([
        fetchAllTokenBalancesFromDAS(walletAddress).catch((dasErr) => {
          logDebug('DAS getAssetsByOwner unavailable or partial:', dasErr?.message)
          return []
        }),
        fetchSPLTokenBalancesFromRPC(walletAddress).catch((rpcErr) => {
          logDebug('RPC token accounts unavailable or partial:', rpcErr?.message)
          return []
        })
      ])

      logDebug(`DAS: ${dasBalances.length} token balances, RPC: ${rpcBalances.length} (Token + Token-2022)`)

      // Merge by mint: RPC is authoritative for balance (finds USDC, RRR, etc.); add DAS-only mints; enrich with DAS metadata when missing
      const byMint = new Map()
      for (const entry of rpcBalances) {
        byMint.set(entry.mint, { ...entry })
      }
      for (const entry of dasBalances) {
        const existing = byMint.get(entry.mint)
        if (!existing) {
          byMint.set(entry.mint, { ...entry })
        } else {
          if (entry.name != null && entry.name !== '') existing.name = entry.name
          if (entry.symbol != null && entry.symbol !== '') existing.symbol = entry.symbol
          if (entry.image != null && entry.image !== '') existing.image = entry.image
        }
      }

      const merged = Array.from(byMint.values())
      logDebug(`Merged SPL balances: ${merged.length} tokens`)
      return merged
    } catch (err) {
      logError('Error fetching SPL token balances:', err)
      return []
    }
  }

  /**
   * Fetch and update metadata for a single token (uses token store cache)
   * Only uses cache if it has a name (successful fetch)
   * Failed fetches are not cached, allowing retry on refresh
   */
  const fetchAndUpdateTokenMetadata = async (token) => {
    // Use token store's fetchTokenInfo which handles caching
    const tokenStore = useTokenStore()
    
    try {
      // Check cache first - only use if it has a name (successful fetch)
      const cached = tokenStore.getCachedTokenInfo(token.mint)
      if (cached && cached.name) {
        // Use cached data (has name = successful fetch)
        return {
          ...token,
          name: cached.name || token.name,
          symbol: cached.symbol || token.symbol,
          image: cached.image || token.image,
          decimals: cached.decimals !== undefined ? cached.decimals : token.decimals
        }
      }
      
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

      // For SPL tokens, use token store's fetchTokenInfo (handles caching)
      // This will only cache if fetch succeeds (has name)
      const tokenInfo = await tokenStore.fetchTokenInfo(token.mint)
      
      // Only update if we got valid data (has name)
      if (tokenInfo && tokenInfo.name) {
        return {
          ...token,
          name: cleanTokenString(tokenInfo.name || token.name),
          symbol: cleanTokenString(tokenInfo.symbol || token.symbol),
          image: tokenInfo.image || token.image,
          decimals: tokenInfo.decimals !== undefined ? tokenInfo.decimals : token.decimals
        }
      }
      
      // If fetch failed (no name), return token as-is (will retry on next refresh)
    } catch (err) {
      // Silently fail - metadata is optional
      return token
    }

    return token
  }

  /**
   * Fetch metadata for all tokens. Uses token store cache first – we don't re-fetch
   * metadata when it's already cached (e.g. after changing page). Only tokens without
   * valid cache hit the network; cached metadata is reused across sections.
   * Only fetches metadata for fungible tokens (decimals > 0); NFTs (decimals === 0)
   * are skipped – collection NFT display uses preloaded collection metadata.
   */
  const fetchAllTokenMetadata = async (tokens) => {
    loadingMetadata.value = true
    const tokenStore = useTokenStore()

    try {
      // Only fetch metadata for fungible tokens (SOL, USDC, RRR, etc.); skip NFTs
      const fungibleTokens = tokens.filter(t => t.decimals != null && t.decimals > 0)
      const nftTokens = tokens.filter(t => t.decimals != null && t.decimals === 0)

      // Satisfy from cache first – no network for tokens we've already fetched
      const tokensNeedingFetch = []
      const cacheHits = new Map()
      for (const token of fungibleTokens) {
        const cached = tokenStore.getCachedTokenInfo(token?.mint)
        if (cached && cached.name) {
          cacheHits.set(token.mint, { ...token, ...cached })
        } else {
          tokensNeedingFetch.push(token)
        }
      }
      // NFTs: use existing balance data only (no metadata fetch); merge with cache if present
      for (const token of nftTokens) {
        const cached = tokenStore.getCachedTokenInfo(token?.mint)
        if (cached && cached.name) {
          cacheHits.set(token.mint, { ...token, ...cached })
        }
      }

      // If everything was in cache, merge and finish without any network calls
      if (tokensNeedingFetch.length === 0) {
        const merged = tokens.map((t) => cacheHits.get(t.mint) ?? t)
        balances.value = merged
        loadingMetadata.value = false
        logDebug(`Metadata: all ${tokens.length} tokens from cache (no fetch)`)
        return merged
      }

      logDebug(`Metadata: ${cacheHits.size} from cache, ${tokensNeedingFetch.length} to fetch`)

      // Prioritize: SOL first, then by balance descending (above-the-fold tokens first)
      const sortedToFetch = [...tokensNeedingFetch].sort((a, b) => {
        if (a.mint === NATIVE_SOL.mint) return -1
        if (b.mint === NATIVE_SOL.mint) return 1
        return (b.balance ?? 0) - (a.balance ?? 0)
      })

      const batchSize = BATCH_SIZES.METADATA_FETCH ?? 10
      const fetchedMap = new Map()

      for (let i = 0; i < sortedToFetch.length; i += batchSize) {
        const batch = sortedToFetch.slice(i, i + batchSize)
        const results = await Promise.allSettled(
          batch.map((token) => fetchAndUpdateTokenMetadata(token).catch(() => token))
        )
        results.forEach((result, index) => {
          const token = batch[index]
          const value = result.status === 'fulfilled' ? result.value : token
          if (token?.mint) fetchedMap.set(token.mint, value)
        })
        // Update UI after each batch so names/images appear progressively
        const merged = tokens.map((t) => fetchedMap.get(t.mint) ?? cacheHits.get(t.mint) ?? t)
        balances.value = merged
      }

      return tokens.map((t) => fetchedMap.get(t.mint) ?? cacheHits.get(t.mint) ?? t)
    } finally {
      loadingMetadata.value = false
    }
  }

  /**
   * Fetch all balances (SOL + SPL tokens)
   * Includes guard to prevent duplicate simultaneous calls and cache TTL
   */
  const fetchBalances = async (forceRefresh = false) => {
    if (!connected.value || !publicKey.value) {
      balances.value = []
      return
    }
    
    const walletAddress = publicKey.value.toString()
    const cacheFresh = !forceRefresh &&
      lastBalanceFetchWallet === walletAddress &&
      balances.value.length > 0 &&
      (Date.now() - lastBalanceFetchTs) < BALANCE_CACHE_TTL_MS
    if (cacheFresh) {
      logDebug('Balance cache still fresh, skipping refetch')
      return
    }

    // Prevent duplicate simultaneous calls
    if (loading.value) {
      logDebug('Balance fetch already in progress, skipping duplicate call')
      return
    }

    loading.value = true
    error.value = null

    const timeoutMs = UI_CONSTANTS.RPC_BALANCE_FETCH_TIMEOUT_MS ?? 25000

    const attemptFetchOnce = async () => {
      const fetchPromise = (async () => {
        const [solBalance, splBalances] = await Promise.all([
          fetchSOLBalance(walletAddress),
          fetchSPLTokenBalances(walletAddress)
        ])
        const allBalancesInner = []
        if (solBalance) allBalancesInner.push(solBalance)
        if (splBalances && splBalances.length > 0) allBalancesInner.push(...splBalances)
        return allBalancesInner
      })()

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Balance fetch timed out after ${timeoutMs / 1000} seconds. Try again on a stronger connection.`))
        }, timeoutMs)
      })

      return Promise.race([fetchPromise, timeoutPromise])
    }

    const maxAttempts = 2
    let lastError = null
    let allBalances = []

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        allBalances = await attemptFetchOnce()
        lastError = null
        break
      } catch (err) {
        lastError = err
        if (attempt < maxAttempts - 1) {
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      }
    }

    if (lastError) {
      const msg = lastError?.message || ''
      logError('Error fetching balances:', lastError)
      if (msg.includes('timed out') || msg.includes('timeout')) {
        error.value = 'Request took too long. Try again on a stronger connection (e.g. Wi‑Fi).'
      } else if (msg.includes('Failed to fetch') || msg.includes('Network request failed') || msg.includes('Load failed')) {
        error.value = 'Network error. Check your connection and try again.'
      } else if (msg.includes('403')) {
        error.value = 'RPC access forbidden. Please check your API key configuration.'
      } else {
        error.value = msg || 'Failed to fetch balances'
      }
      balances.value = []
      loading.value = false
      return
    }

    balances.value = allBalances
    lastBalanceFetchTs = Date.now()
    lastBalanceFetchWallet = walletAddress

    if (allBalances.length > 0) {
      fetchAllTokenMetadata(allBalances).then(tokensWithMetadata => {
        balances.value = tokensWithMetadata
      })
    }

    loading.value = false
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
      logError(`Error fetching balance for token ${mintAddress}:`, err)
      return 0
    }
  }

  // Track if fetch is in progress to prevent duplicate calls
  let fetchingBalances = false
  
  // Watch for wallet connection changes (only if autoFetch is enabled)
  if (autoFetch) {
    watch([connected, publicKey], ([isConnected, pubKey], [oldConnected, oldPubKey]) => {
      // Only fetch if wallet actually changed (not just re-triggered)
      const walletChanged = isConnected !== oldConnected || 
                           (pubKey && oldPubKey && pubKey.toString() !== oldPubKey.toString())
      
      if (isConnected && pubKey && walletChanged && !fetchingBalances) {
        fetchingBalances = true
        fetchBalances().finally(() => {
          fetchingBalances = false
        })
      } else if (!isConnected) {
        balances.value = []
      }
    }, { immediate: true })
  }

  /**
   * DEBUG: Inspect what data is available from a mint account. Use only when debugging.
   */
  const inspectMintAccount = async (mintAddress) => {
    try {
      const mintPublicKey = new PublicKey(mintAddress)
      const accountInfo = await connection.getParsedAccountInfo(mintPublicKey)

      logDebug('[WalletBalances] Inspect mint:', mintAddress, {
        exists: !!accountInfo.value,
        owner: accountInfo.value?.owner?.toString(),
        lamports: accountInfo.value?.lamports,
        dataKeys: accountInfo.value?.data && typeof accountInfo.value.data === 'object' ? Object.keys(accountInfo.value.data) : null
      })
      if (accountInfo.value?.data && typeof accountInfo.value.data === 'object' && 'parsed' in accountInfo.value.data) {
        logDebug('[WalletBalances] Parsed info:', accountInfo.value.data.parsed?.info)
      }
      if (connected.value && publicKey.value) {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey.value, { mint: mintPublicKey })
        logDebug('[WalletBalances] Token accounts for mint:', tokenAccounts.value.length)
      }
      return accountInfo
    } catch (err) {
      logError('Error inspecting mint account:', err)
      return null
    }
  }

  // Debug API only when window.__DEBUG_WALLET_BALANCES__ is set (e.g. in console before loading)
  if (typeof window !== 'undefined' && window.__DEBUG_WALLET_BALANCES__) {
    window.debugWalletBalances = {
      inspectMintAccount,
      inspectRawResponse: async () => {
        if (connected.value && publicKey.value) {
          logDebug('Fetching raw token accounts response...')
          await fetchBalances()
        } else {
          logWarning('Wallet not connected')
        }
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
