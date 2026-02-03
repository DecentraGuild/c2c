/**
 * Escrow Transactions Composable
 * Provides easy-to-use functions for escrow operations
 */

import { ref, computed } from 'vue'
import { useWalletContext } from './useWalletContext'
import {
  buildInitializeTransaction,
  buildExchangeTransaction,
  buildCancelTransaction
} from '@/utils/escrowTransactions'
import { useSolanaConnection } from './useSolanaConnection'
import { useEscrowStore } from '@/stores/escrow'
import { formatError } from '@/utils/errorHandler'

/**
 * Composable for escrow transaction operations
 * @returns {Object} Transaction functions and state
 */
export function useEscrowTransactions() {
  const { walletAdapter, anchorWallet, publicKey, validateWallet: validateWalletReady } = useWalletContext()
  const connection = useSolanaConnection()
  const loading = ref(false)
  const error = ref(null)
  const escrowStore = useEscrowStore()

  const validateWallet = () => {
    const { anchorWallet: wallet } = validateWalletReady('perform this transaction')
    return wallet
  }
  
  const sendAndConfirm = async (transaction) => {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = publicKey.value

    const signature = await walletAdapter.sendTransaction(transaction, connection, {
      skipPreflight: false,
      maxRetries: 3
    })
    
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed')
    
    return signature
  }
  
  const initializeEscrow = async (params) => {
    validateWallet()
    loading.value = true
    error.value = null
    escrowStore.setError('transaction', null)
    
    try {
      const wallet = params.wallet || anchorWallet.value
      const transaction = await buildInitializeTransaction({
        ...params,
        maker: publicKey.value,
        connection,
        wallet
      })
      return await sendAndConfirm(transaction)
    } catch (err) {
      const errorMsg = formatError(err, 'initialize escrow', 'Failed to initialize escrow')
      error.value = errorMsg
      escrowStore.setError('transaction', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const exchangeEscrow = async (params) => {
    validateWallet()
    loading.value = true
    error.value = null
    escrowStore.setError('transaction', null)
    
    try {
      const wallet = params.wallet || anchorWallet.value
      const transaction = await buildExchangeTransaction({
        ...params,
        taker: publicKey.value,
        connection,
        wallet
      })
      return await sendAndConfirm(transaction)
    } catch (err) {
      const errorMsg = formatError(err, 'exchange escrow', 'Failed to exchange escrow')
      error.value = errorMsg
      escrowStore.setError('transaction', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const cancelEscrow = async (params) => {
    validateWallet()
    loading.value = true
    error.value = null
    escrowStore.setError('transaction', null)
    
    try {
      const wallet = params.wallet || anchorWallet.value
      const transaction = await buildCancelTransaction({
        ...params,
        maker: publicKey.value,
        connection,
        wallet
      })
      return await sendAndConfirm(transaction)
    } catch (err) {
      const errorMsg = formatError(err, 'cancel escrow', 'Failed to cancel escrow')
      error.value = errorMsg
      escrowStore.setError('transaction', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    // State (computed for reactivity)
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    // Methods
    initializeEscrow,
    exchangeEscrow,
    cancelEscrow
  }
}
