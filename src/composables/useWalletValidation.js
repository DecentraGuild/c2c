/**
 * Wallet validation composable
 * Provides consistent wallet validation across the app
 */

import { computed } from 'vue'
import { useWallet, useAnchorWallet } from 'solana-wallets-vue'

/**
 * Composable for wallet validation
 * @returns {Object} Wallet validation state and functions
 */
export function useWalletValidation() {
  const walletAdapter = useWallet()
  const anchorWallet = useAnchorWallet()
  const { publicKey, connected } = walletAdapter
  
  /**
   * Check if wallet is fully connected and ready
   */
  const isWalletReady = computed(() => {
    return connected.value && !!publicKey.value && !!anchorWallet.value
  })
  
  /**
   * Validate wallet and throw if not ready
   * @param {string} action - Action being performed (for error message)
   * @returns {Object} Wallet objects (walletAdapter, anchorWallet, publicKey)
   * @throws {Error} If wallet is not ready
   */
  const validateWallet = (action = 'perform this action') => {
    if (!connected.value || !publicKey.value) {
      throw new Error(`Please connect your wallet first to ${action}`)
    }
    
    if (!anchorWallet.value) {
      throw new Error('Anchor wallet is not available. Please wait for wallet to fully connect or reconnect your wallet.')
    }
    
    return {
      walletAdapter,
      anchorWallet: anchorWallet.value,
      publicKey: publicKey.value
    }
  }
  
  return {
    connected,
    publicKey,
    anchorWallet,
    isWalletReady,
    validateWallet
  }
}
