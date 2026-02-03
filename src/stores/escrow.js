/**
 * Escrow Store
 * Manages escrow data from blockchain (load only; list is replaced on each load).
 * Form state is in escrowForm.js.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchAllEscrows } from '@/utils/escrowTransactions'
import { useSolanaConnection } from '@/composables/useSolanaConnection'
import { useTokenStore } from '@/stores/token'
import { useStorefrontStore } from '@/stores/storefront'
import { formatEscrowData } from '@/utils/escrowHelpers'
import { getDecimalsForMintFromCollections } from '@/utils/collectionHelpers'
import { toPublicKey } from '@/utils/solanaUtils'
import { logError } from '@/utils/logger'
import { BATCH_SIZES } from '@/utils/constants'

export const useEscrowStore = defineStore('escrow', () => {
  // Escrows list (from blockchain)
  const escrows = ref([])
  const loadingEscrows = ref(false)
  
  // Error handling for data operations and create-form (useErrorDisplay reads these)
  const errors = ref({
    transaction: null,
    network: null,
    escrows: null,
    form: null // { general?: string, ... } when set by CreateEscrow
  })
  
  // Computed
  const activeEscrows = computed(() => {
    return escrows.value.filter(e => e.status !== 'closed')
  })
  
  // Actions
  
  /**
   * Load escrows from blockchain (optionally filtered by maker)
   * @param {string|PublicKey|null} makerPublicKey - Optional maker public key to filter by
   * @returns {Promise<void>}
   */
  const loadEscrows = async (makerPublicKey = null) => {
    loadingEscrows.value = true
    errors.value.escrows = null
    try {
      const connection = useSolanaConnection()
      const tokenStore = useTokenStore()
      const storefrontStore = useStorefrontStore()
      const storefronts = storefrontStore.storefronts || []

      // Convert makerPublicKey to PublicKey if it's a string
      const makerFilter = makerPublicKey 
        ? toPublicKey(makerPublicKey)
        : null
      
      // Fetch escrows from blockchain
      const rawEscrows = await fetchAllEscrows(connection, makerFilter)
      
      // Safety check: ensure rawEscrows is an array
      if (!rawEscrows || !Array.isArray(rawEscrows)) {
        logError('fetchAllEscrows returned invalid data:', rawEscrows)
        escrows.value = []
        errors.value.escrows = 'Invalid data received from blockchain'
        return
      }
      
      // Format escrows with token information
      // Process in batches to avoid blocking the UI
      const formattedEscrows = []
      
      for (let i = 0; i < rawEscrows.length; i += BATCH_SIZES.ESCROW_PROCESSING) {
        const batch = rawEscrows.slice(i, i + BATCH_SIZES.ESCROW_PROCESSING)
        const batchResults = await Promise.all(
          batch.map(async (escrowData) => {
            try {
              if (!escrowData || !escrowData.account || !escrowData.publicKey) {
                logError('Invalid escrow data:', escrowData)
                return null
              }
              
              const escrowAccount = escrowData.account
              const escrowPubkey = escrowData.publicKey
              const depositMint = escrowAccount.depositToken.toString()
              const requestMint = escrowAccount.requestToken.toString()

              // Fetch token info for deposit and request tokens
              let [depositTokenInfo, requestTokenInfo] = await Promise.all([
                tokenStore.fetchTokenInfo(depositMint),
                tokenStore.fetchTokenInfo(requestMint)
              ])

              // Prefer collection decimals (e.g. RACE PASS = 0); blockchain amounts are in raw units per these decimals
              const depositDecimalsFromCollection = getDecimalsForMintFromCollections(depositMint, storefronts)
              const requestDecimalsFromCollection = getDecimalsForMintFromCollections(requestMint, storefronts)
              const depositDecimals = depositDecimalsFromCollection ?? depositTokenInfo?.decimals ?? 9
              const requestDecimals = requestDecimalsFromCollection ?? requestTokenInfo?.decimals ?? 9
              depositTokenInfo = {
                mint: depositMint,
                name: depositTokenInfo?.name ?? null,
                symbol: depositTokenInfo?.symbol ?? null,
                image: depositTokenInfo?.image ?? null,
                decimals: depositDecimals
              }
              requestTokenInfo = {
                mint: requestMint,
                name: requestTokenInfo?.name ?? null,
                symbol: requestTokenInfo?.symbol ?? null,
                image: requestTokenInfo?.image ?? null,
                decimals: requestDecimals
              }
              
              // Format escrow data using helper function
              const formatted = formatEscrowData(
                { account: escrowAccount, publicKey: escrowPubkey },
                depositTokenInfo,
                requestTokenInfo
              )
              
              // Add createdAt timestamp
              // Note: For accurate creation time, we would need to fetch the transaction signature
              // and get blockTime from the transaction. This requires additional RPC calls.
              // Using current time as fallback - can be enhanced later if needed.
              return {
                ...formatted,
                createdAt: new Date().toISOString()
              }
            } catch (err) {
              logError('Failed to format escrow:', err)
              return null
            }
          })
        )
        
        // Filter out null values and add to results
        const validResults = batchResults.filter(e => e !== null)
        formattedEscrows.push(...validResults)
      }
      
      escrows.value = formattedEscrows
    } catch (error) {
      logError('Failed to load escrows:', error)
      const msg = error?.message || ''
      if (msg.includes('timed out') || msg.includes('timeout')) {
        errors.value.escrows = 'Request took too long. Try again on a stronger connection (e.g. Wi‑Fi).'
      } else if (msg.includes('Failed to fetch') || msg.includes('Network request failed') || msg.includes('Load failed')) {
        errors.value.escrows = 'Network error. Check your connection and try again.'
      } else {
        errors.value.escrows = msg || 'Failed to load escrows'
      }
      escrows.value = []
    } finally {
      loadingEscrows.value = false
    }
  }
  
  /**
   * Load all escrows from blockchain (convenience method)
   * Same as loadEscrows(null)
   */
  const loadAllEscrows = async () => {
    return loadEscrows(null)
  }
  
  /**
   * Clear all errors
   */
  const clearErrors = () => {
    errors.value = {
      transaction: null,
      network: null,
      escrows: null,
      form: null
    }
  }
  
  /**
   * Set a specific error
   * @param {string} type - Error type ('transaction' | 'network' | 'escrows' | 'form')
   * @param {string|Object|null} error - Error message, or for 'form': { general?: string, ... }
   */
  const setError = (type, error) => {
    errors.value[type] = error
  }
  
  return {
    // State
    escrows,
    loadingEscrows,
    errors,
    
    // Computed
    activeEscrows,
    
    // Actions
    loadEscrows,
    loadAllEscrows,
    clearErrors,
    setError
  }
})
