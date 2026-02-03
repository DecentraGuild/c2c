/**
 * Unified wallet context: wallet adapter state + validation.
 * Use when you need to send transactions or validate wallet (create/fill/cancel escrow).
 * For read-only state (connected, publicKey) you can use useWalletStore() instead.
 */

import { useWallet, useAnchorWallet } from 'solana-wallets-vue'
import { useWalletValidation } from './useWalletValidation'

export function useWalletContext() {
  const walletAdapter = useWallet()
  const anchorWallet = useAnchorWallet()
  const { isWalletReady, validateWallet } = useWalletValidation()

  return {
    walletAdapter,
    anchorWallet,
    connected: walletAdapter.connected,
    publicKey: walletAdapter.publicKey,
    isWalletReady,
    validateWallet
  }
}
