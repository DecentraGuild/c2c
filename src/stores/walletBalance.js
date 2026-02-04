/**
 * Wallet Balance Store
 * Single source of truth for wallet balances (SOL + SPL) across the app.
 * Wraps useWalletBalances composable so views/components don't create their own instances.
 */

import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useWalletBalances } from '@/composables/useWalletBalances'

export const useWalletBalanceStore = defineStore('walletBalance', () => {
  // Single composable instance for the whole app
  const walletBalances = useWalletBalances({ autoFetch: true })

  // State
  const balances = computed(() => walletBalances.balances.value)

  // Loading / error
  const loadingBalances = computed(() => walletBalances.loading.value)
  const loadingMetadata = computed(() => walletBalances.loadingMetadata.value)
  const balancesError = computed(() => walletBalances.error.value)

  // Actions
  const fetchBalances = async (forceRefresh = false) => {
    return walletBalances.fetchBalances(forceRefresh)
  }

  const getTokenBalance = (mint) => {
    return walletBalances.getTokenBalance(mint)
  }

  const getTokenInfo = (mint) => {
    return walletBalances.getTokenInfo(mint)
  }

  const fetchSingleTokenBalance = async (mint) => {
    return walletBalances.fetchSingleTokenBalance(mint)
  }

  return {
    // State
    balances,

    // Loading / error
    loadingBalances,
    loadingMetadata,
    balancesError,

    // Actions
    fetchBalances,
    getTokenBalance,
    getTokenInfo,
    fetchSingleTokenBalance
  }
})

