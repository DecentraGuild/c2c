/**
 * Wallet store – single place for wallet connection state across the app.
 * Use for read-only state (connected, publicKey, isWalletReady). For sending tx or validateWallet, use useWalletContext().
 */

import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useWallet, useAnchorWallet } from 'solana-wallets-vue'

export const useWalletStore = defineStore('wallet', () => {
  const walletAdapter = useWallet()
  const anchorWallet = useAnchorWallet()

  const connected = computed(() => walletAdapter.connected.value)
  const publicKey = computed(() => walletAdapter.publicKey.value)
  const isWalletReady = computed(
    () => connected.value && !!publicKey.value && !!anchorWallet.value
  )

  return {
    walletAdapter,
    anchorWallet,
    connected,
    publicKey,
    isWalletReady
  }
})
