/**
 * Escrow Transactions Composable
 * Provides easy-to-use functions for escrow operations
 */

import { ref } from 'vue'
import { useWallet, useAnchorWallet } from 'solana-wallets-vue'
import { 
  buildInitializeTransaction,
  buildExchangeTransaction,
  buildCancelTransaction
} from '../utils/escrowTransactions'
import { useSolanaConnection } from './useSolanaConnection'
import { useEscrowStore } from '../stores/escrow'
import { PublicKey } from '@solana/web3.js'
import { getUserFriendlyError, isRetryableError } from '../utils/errorParser'

/**
 * Composable for escrow transaction operations
 * @returns {Object} Transaction functions and state
 */
export function useEscrowTransactions() {
  const walletAdapter = useWallet()
  const anchorWallet = useAnchorWallet()
  const { publicKey, sendTransaction, connected } = walletAdapter
  const connection = useSolanaConnection()
  const loading = ref(false)
  const error = ref(null)
  
  // Use store for centralized error handling
  const escrowStore = useEscrowStore()
  
  const validateWallet = () => {
    if (!connected.value || !publicKey.value) {
      throw new Error('Wallet not connected')
    }
    const wallet = anchorWallet.value
    if (!wallet) {
      throw new Error('Anchor wallet is not available. Please wait for wallet to fully connect.')
    }
    return wallet
  }
  
  const sendAndConfirm = async (transaction) => {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = publicKey.value
    
    const signature = await sendTransaction(transaction, connection, {
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
      const errorMsg = getUserFriendlyError(err, 'Failed to initialize escrow')
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
      const errorMsg = getUserFriendlyError(err, 'Failed to exchange escrow')
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
      const errorMsg = getUserFriendlyError(err, 'Failed to cancel escrow')
      error.value = errorMsg
      escrowStore.setError('transaction', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    loading,
    error,
    initializeEscrow,
    exchangeEscrow,
    cancelEscrow
  }
}
