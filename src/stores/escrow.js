/**
 * Escrow Store
 * Manages escrow data from blockchain (CRUD operations)
 * Form state has been moved to escrowForm.js for better separation of concerns
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchAllEscrows } from '../utils/escrowTransactions'
import { useSolanaConnection } from '../composables/useSolanaConnection'
import { useTokenStore } from './token'
import { formatEscrowData } from '../utils/escrowHelpers'
import { toPublicKey } from '../utils/solanaUtils'
import { logError } from '../utils/logger'
import { BATCH_SIZES } from '../utils/constants'

export const useEscrowStore = defineStore('escrow', () => {
  // Escrows list (from blockchain)
  const escrows = ref([])
  const loadingEscrows = ref(false)
  
  // Error handling for data operations
  const errors = ref({
    transaction: null,
    network: null,
    escrows: null
  })
  
  // Computed
  const activeEscrows = computed(() => {
    return escrows.value.filter(e => e.status !== 'closed')
  })
  
  // Actions
  
  const addEscrow = (escrow) => {
    escrows.value.unshift(escrow)
  }
  
  const updateEscrow = (escrowId, updates) => {
    const index = escrows.value.findIndex(e => e.id === escrowId)
    if (index !== -1) {
      escrows.value[index] = { ...escrows.value[index], ...updates }
    }
  }
  
  const removeEscrow = (escrowId) => {
    escrows.value = escrows.value.filter(e => e.id !== escrowId)
  }
  
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
              
              // Fetch token info for deposit and request tokens
              const [depositTokenInfo, requestTokenInfo] = await Promise.all([
                tokenStore.fetchTokenInfo(escrowAccount.depositToken.toString()),
                tokenStore.fetchTokenInfo(escrowAccount.requestToken.toString())
              ])
              
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
      escrows: null
    }
  }
  
  /**
   * Set a specific error
   * @param {string} type - Error type ('transaction' | 'network' | 'escrows')
   * @param {string|null} error - Error message
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
    addEscrow,
    updateEscrow,
    removeEscrow,
    loadEscrows,
    loadAllEscrows,
    clearErrors,
    setError
  }
})
