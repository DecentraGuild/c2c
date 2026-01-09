<template>
  <div class="min-h-screen bg-primary-bg py-3 sm:py-4 px-3 sm:px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header with Back Button -->
      <div class="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <button
          @click="$router.back()"
          class="p-2 hover:bg-secondary-bg rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Go back"
        >
          <Icon icon="mdi:arrow-left" class="w-5 h-5 sm:w-6 sm:h-6 text-text-primary" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold text-text-primary mb-1">Offer</h1>
          <p class="text-xs sm:text-sm text-text-muted font-mono truncate">{{ truncateAddress(escrowId) }}</p>
        </div>
        <button
          @click="showShareModal()"
          class="p-2 hover:bg-secondary-bg rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Share escrow"
        >
          <Icon icon="mdi:share-variant" class="w-5 h-5 sm:w-6 sm:h-6 text-text-muted hover:text-text-primary" />
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-lg text-sm text-status-error">
        {{ error }}
      </div>

      <!-- Loading State -->
      <BaseLoading v-if="loading" message="Loading escrow details..." />

      <!-- Escrow Details -->
      <div v-else-if="escrow" class="space-y-4">
        <!-- Status Message (for filled/expired escrows) -->
        <EscrowStatusMessage 
          v-if="escrow.status !== 'active'"
          :escrow="escrow"
        />

        <!-- Exchange/Fill Section (only for active escrows) -->
        <EscrowFillSection
          :escrow="escrow"
          :request-token-balance="requestTokenBalance"
          :loading-request-token-balance="loadingRequestTokenBalance"
          :max-fill-amount="maxFillAmount"
          v-model:fill-amount-percent="fillAmountPercent"
          v-model:fill-amount="fillAmount"
          :expected-receive-amount="expectedReceiveAmount"
          :exchange-costs="exchangeCosts"
          :exchanging="exchanging"
          :can-fill="canFill"
          :can-exchange="canExchange"
          @update-fill-amount-from-input="updateFillAmountFromInput"
          @handle-fill-amount-keydown="handleFillAmountKeydown"
          @set-fill-percentage="setFillPercentage"
          @exchange="exchangeEscrow"
        />

        <!-- Price Display Card -->
        <EscrowPriceDisplay :escrow="escrow" />

        <!-- Cancel/Claim Button -->
        <div v-if="canCancel" class="flex flex-col sm:flex-row gap-3">
          <button
            @click="cancelEscrow"
            :disabled="cancelling"
            class="btn-cancel flex-1 py-3 disabled:opacity-50 min-h-[44px] text-sm sm:text-base"
          >
            <Icon v-if="cancelling" icon="svg-spinners:ring-resize" class="w-5 h-5 inline mr-2" />
            <Icon v-else :icon="escrow.status === 'filled' ? 'mdi:check-circle' : 'mdi:close'" class="w-5 h-5 inline mr-2" />
            {{ escrow.status === 'filled' ? 'COMPLETE' : 'CANCEL/CLOSE' }}
          </button>
        </div>

        <!-- Escrow Details Card -->
        <EscrowDetailsSection
          :escrow="escrow"
          :show="showEscrowDetails"
          @toggle="showEscrowDetails = !showEscrowDetails"
        />
      </div>

      <!-- Not Found -->
      <BaseLoading
        v-else
        icon="mdi:alert-circle-outline"
        message="Escrow not found"
        :container-class="'card text-center py-12'"
      >
        <p class="text-sm text-text-muted mt-2">The escrow you're looking for doesn't exist or has been closed.</p>
      </BaseLoading>
    </div>

    <!-- Confirmation Modal (only for cancel/claim) -->
    <ConfirmModal
      v-model:show="showConfirm"
      :title="confirmTitle"
      :message="confirmMessage"
      :loading="confirmLoading || cancelling"
      confirm-text="Confirm"
      cancel-text="Cancel"
      @confirm="handleConfirmAction"
    />

    <!-- Share Modal -->
    <BaseShareModal
      v-model:show="showShare"
      :url="shareUrl"
      title="Share Escrow"
      url-label="Escrow Link"
    />
  </div>
</template>

<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useEscrowStore } from '../stores/escrow'
import { useWallet, useAnchorWallet } from 'solana-wallets-vue'
import { useEscrowTransactions } from '../composables/useEscrowTransactions'
import { useSolanaConnection } from '../composables/useSolanaConnection'
import { useTokenRegistry } from '../composables/useTokenRegistry'
import { useWalletBalances } from '../composables/useWalletBalances'
import { formatBalance, truncateAddress, formatTimestamp, fromSmallestUnits, toSmallestUnits, formatDecimals } from '../utils/formatters'
import { fetchEscrowByAddress } from '../utils/escrowTransactions'
import { calculateExchangeCosts } from '../utils/transactionCosts'
import { useTransactionCosts } from '../composables/useTransactionCosts'
import { FUND_TAKER_COSTS, TRANSACTION_COSTS } from '../utils/constants/fees'
import { PublicKey } from '@solana/web3.js'
import ConfirmModal from '../components/ConfirmModal.vue'
import BaseShareModal from '../components/BaseShareModal.vue'
import BaseAddressDisplay from '../components/BaseAddressDisplay.vue'
import BaseTokenImage from '../components/BaseTokenImage.vue'
import TokenAmountDisplay from '../components/TokenAmountDisplay.vue'
import BaseLoading from '../components/BaseLoading.vue'
import EscrowPriceDisplay from '../components/EscrowPriceDisplay.vue'
import EscrowFillSection from '../components/EscrowFillSection.vue'
import EscrowDetailsSection from '../components/EscrowDetailsSection.vue'
import EscrowStatusMessage from '../components/EscrowStatusMessage.vue'
import { useToast } from '../composables/useToast'
import { useDecimalHandling } from '../composables/useDecimalHandling'
import { useConfirmationModal } from '../composables/useConfirmationModal'
import { useShareModal } from '../composables/useShareModal'
import { canUserExchangeEscrow } from '../utils/escrowValidation'
import { useDebounce, DEBOUNCE_DELAYS } from '../composables/useDebounce'
import { processAmountInput, shouldPreventKeydown } from '../utils/inputHandling'
import { validateRecipientAddress, canTakerExchange, isPublicRecipient } from '../utils/recipientValidation'
import { toPublicKey, toBN } from '../utils/solanaUtils'
import { formatEscrowData, calculateEscrowStatus } from '../utils/escrowHelpers'
import { calculateDepositAmountToExchange, prepareExchangeAmounts } from '../utils/exchangeHelpers'
import { formatUserFriendlyError } from '../utils/errorMessages'

const route = useRoute()
const router = useRouter()
const escrowStore = useEscrowStore()
const walletAdapter = useWallet()
const anchorWallet = useAnchorWallet()
const { publicKey, connected } = walletAdapter
const connection = useSolanaConnection()
const tokenRegistry = useTokenRegistry()
const { getTokenBalance, fetchSingleTokenBalance } = useWalletBalances({ autoFetch: false })
const { cancelEscrow: cancelEscrowTx, exchangeEscrow: exchangeEscrowTx, loading: txLoading } = useEscrowTransactions()
const { success, error: showError, warning } = useToast()

// Use composables for modal management
const {
  showConfirm,
  confirmTitle,
  confirmMessage,
  loading: confirmLoading,
  show: showConfirmModal,
  handleConfirm: handleConfirmAction
} = useConfirmationModal()

const {
  showShare,
  shareUrl,
  open: openShareModal
} = useShareModal()

// State
const escrowId = computed(() => route.params.id)
const loading = ref(true)
const error = ref(null)
const escrow = ref(null)
const cancelling = ref(false)
const exchanging = ref(false)
const showEscrowDetails = ref(false)

// Fill/Exchange state
const fillAmountPercent = ref(100)
const fillAmount = ref('')

// Computed

const canCancel = computed(() => {
  if (!escrow.value || !connected.value || !publicKey.value) return false
  return escrow.value.maker === publicKey.value.toString()
})

const canExchange = computed(() => {
  if (!escrow.value || !connected.value || !publicKey.value) return false
  return canUserExchangeEscrow(escrow.value, publicKey.value)
})


// Fill/Exchange computed properties
const requestTokenBalance = ref(0)
const loadingRequestTokenBalance = ref(false)

const maxFillAmount = computed(() => {
  if (!escrow.value) return 0
  // Maximum fill is limited by:
  // 1. Remaining deposit amount (converted to request token amount)
  // 2. User's wallet balance
  const maxFromEscrow = escrow.value.depositRemaining * escrow.value.price
  const maxFromBalance = requestTokenBalance.value
  return Math.min(maxFromEscrow, maxFromBalance)
})

// Function to load request token balance
const loadRequestTokenBalance = async () => {
  if (!escrow.value || !connected.value || !publicKey.value) {
    requestTokenBalance.value = 0
    return
  }

  loadingRequestTokenBalance.value = true
  try {
    const balance = await fetchSingleTokenBalance(escrow.value.requestToken.mint)
    requestTokenBalance.value = balance
  } catch (error) {
    console.error('Failed to load request token balance:', error)
    requestTokenBalance.value = 0
  } finally {
    loadingRequestTokenBalance.value = false
  }
}

const currentFillAmount = computed(() => {
  if (!escrow.value || !escrow.value.allowPartialFill) {
    return escrow.value ? escrow.value.requestAmount : 0
  }
  
  if (fillAmount.value && !isNaN(parseFloat(fillAmount.value))) {
    return parseFloat(fillAmount.value)
  }
  
  // Calculate from percentage
  return (maxFillAmount.value * fillAmountPercent.value) / 100
})

const expectedReceiveAmount = computed(() => {
  if (!escrow.value) return 0
  // Calculate how much deposit token we'll receive based on fill amount
  return currentFillAmount.value / escrow.value.price
})

const canFill = computed(() => {
  if (!escrow.value || !connected.value) return false
  if (escrow.value.allowPartialFill) {
    return currentFillAmount.value > 0 && currentFillAmount.value <= maxFillAmount.value && currentFillAmount.value <= requestTokenBalance.value
  }
  return requestTokenBalance.value >= escrow.value.requestAmount && !loadingRequestTokenBalance.value
})

// Helper functions for fill amount
const { getStepForDecimals, getPlaceholderForDecimals } = useDecimalHandling()

const setFillPercentage = (percentage) => {
  fillAmountPercent.value = percentage
  const amount = (maxFillAmount.value * percentage) / 100
  
  // For tokens with 0 decimals, ensure we use whole numbers only
  if (escrow.value && escrow.value.requestToken.decimals === 0) {
    fillAmount.value = Math.floor(amount).toString()
  } else {
    fillAmount.value = formatDecimals(amount)
  }
}

const updateFillAmountFromInput = (event) => {
  const inputElement = event?.target
  let rawValue = inputElement?.value || fillAmount.value || ''
  
  // Handle empty input
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    fillAmount.value = ''
    fillAmountPercent.value = 0
    return
  }
  
  // Convert to string and trim
  let amountValue = String(rawValue).trim()
  
  // Process input based on token decimals
  const decimals = escrow.value?.requestToken?.decimals ?? 9
  amountValue = processAmountInput(amountValue, decimals, inputElement)
  
  // Update fillAmount
  fillAmount.value = amountValue
  
  // Calculate percentage
  const amount = parseFloat(amountValue)
  if (isNaN(amount) || maxFillAmount.value === 0) {
    fillAmountPercent.value = 0
    return
  }
  
  fillAmountPercent.value = Math.min(100, Math.max(0, (amount / maxFillAmount.value) * 100))
}

const handleFillAmountKeydown = (event) => {
  const decimals = escrow.value?.requestToken?.decimals ?? 9
  if (shouldPreventKeydown(event, decimals)) {
    event.preventDefault()
    return false
  }
}

// Watch fillAmountPercent to update fillAmount
watch(fillAmountPercent, (newPercent) => {
  if (escrow.value && escrow.value.allowPartialFill) {
    const amount = (maxFillAmount.value * newPercent) / 100
    
    // For tokens with 0 decimals, ensure we use whole numbers only
    if (escrow.value.requestToken.decimals === 0) {
      fillAmount.value = Math.floor(amount).toString()
    } else {
      fillAmount.value = formatDecimals(amount)
    }
  }
})

// Transaction costs composable for exchange
const { costBreakdown: exchangeCosts, loadingCosts: loadingExchangeCosts, calculateCosts: debouncedLoadExchangeCosts } = useTransactionCosts({
  costCalculator: calculateExchangeCosts,
  getParams: () => {
    if (!escrow.value || !connected.value || !publicKey.value) {
      return null
    }
    return {
      taker: publicKey.value,
      depositTokenMint: escrow.value.depositToken.mint,
      requestTokenMint: escrow.value.requestToken.mint
    }
  }
})

// Watch escrow changes to reset fill amount and load balance
watch(() => escrow.value, (newEscrow) => {
  if (newEscrow) {
    // Only load balance and costs for active escrows (needed for filling)
    if (newEscrow.status === 'active') {
      // Load the request token balance (immediate - needed for UI)
      loadRequestTokenBalance()
      
      // Load exchange costs (debounced - expensive operation)
      debouncedLoadExchangeCosts()
      
      if (newEscrow.allowPartialFill) {
        fillAmountPercent.value = 100
        // Will be set after balance loads
      } else {
        fillAmount.value = ''
        fillAmountPercent.value = 100
      }
    } else {
      // For filled/expired escrows, reset fill amount state
      fillAmount.value = ''
      fillAmountPercent.value = 100
    }
  }
}, { immediate: true })

// Watch for balance changes to update fill amount
watch(requestTokenBalance, (newBalance) => {
  if (escrow.value && escrow.value.allowPartialFill && newBalance > 0) {
    // Update fill amount when balance loads
    const amount = Math.min(maxFillAmount.value, newBalance)
    fillAmount.value = formatDecimals(amount)
    if (maxFillAmount.value > 0) {
      fillAmountPercent.value = Math.min(100, (amount / maxFillAmount.value) * 100)
    }
  }
})

// Load escrow
const loadEscrow = async () => {
  if (!escrowId.value) {
    error.value = 'No escrow ID provided'
    loading.value = false
    return
  }

  // Validate escrow ID format (should be a valid Solana public key)
  try {
    toPublicKey(escrowId.value, 'Invalid escrow ID format')
  } catch (err) {
    error.value = formatUserFriendlyError(err, 'validate escrow ID')
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const rawEscrow = await fetchEscrowByAddress(connection, escrowId.value)
    
    if (!rawEscrow) {
      error.value = 'Escrow not found'
      escrow.value = null
      loading.value = false
      return
    }

    const escrowAccount = rawEscrow.account
    const escrowPubkey = rawEscrow.publicKey

    // Fetch token info
    const [depositTokenInfo, requestTokenInfo] = await Promise.all([
      tokenRegistry.fetchTokenInfo(escrowAccount.depositToken.toString()),
      tokenRegistry.fetchTokenInfo(escrowAccount.requestToken.toString())
    ])

    // Format escrow data using helper function
    escrow.value = formatEscrowData(
      { account: escrowAccount, publicKey: escrowPubkey },
      depositTokenInfo,
      requestTokenInfo
    )
    
    // Debug logging for decimal issues
    console.debug('Escrow token info:', {
      depositToken: {
        mint: escrowAccount.depositToken.toString(),
        decimals: depositTokenInfo.decimals,
        symbol: depositTokenInfo.symbol,
        rawAmount: escrowAccount.tokensDepositInit.toString()
      },
      requestToken: {
        mint: escrowAccount.requestToken.toString(),
        decimals: requestTokenInfo.decimals,
        symbol: requestTokenInfo.symbol
      },
      amounts: {
        depositInitial: escrow.value.depositAmount,
        depositRemaining: escrow.value.depositRemaining
      }
    })
    
    // Log the actual escrow state for debugging
    console.log('Loaded escrow recipient state:', {
      recipient: escrow.value.recipient || 'null',
      recipientIsSystemProgram: isPublicRecipient(escrow.value.recipientPubkey),
      onlyRecipient: escrow.value.onlyRecipient,
      isPublicRecipient: isPublicRecipient(escrow.value.recipientPubkey),
      escrowId: escrow.value.id
    })

    // Auto-open share modal if share query parameter is present
    if (route.query.share === 'true') {
      // Remove the query parameter from URL
      router.replace({ path: route.path, query: {} })
      // Open share modal after a small delay to ensure UI is ready
      setTimeout(() => {
        showShareModal()
      }, 100)
    }
  } catch (err) {
    console.error('Failed to load escrow:', err)
    error.value = formatUserFriendlyError(err, 'load escrow')
  } finally {
    loading.value = false
  }
}

const showShareModal = () => {
  openShareModal(`${window.location.origin}/escrow/${escrowId.value}`)
}

const showCancelConfirm = () => {
  if (!connected.value || !publicKey.value || !anchorWallet.value) {
    warning('Please connect your wallet first')
    return
  }

  const title = escrow.value.status === 'filled' ? 'Complete Escrow' : 'Cancel Escrow'
  const message = escrow.value.status === 'filled' 
    ? 'This will close the escrow account and recover the account rent (SOL). Tokens have already been received automatically when the escrow was filled.'
    : 'Are you sure you want to cancel this escrow? This action cannot be undone.'
  
  showConfirmModal(title, message, executeCancel)
}

const executeCancel = async () => {
  cancelling.value = true

  try {
    const seedBN = toBN(escrow.value.seed)
    
    await cancelEscrowTx({
      depositTokenMint: escrow.value.depositToken.mint,
      requestTokenMint: escrow.value.requestToken.mint,
      seed: seedBN
    })

    success('Escrow cancelled successfully!')
    router.push('/manage')
  } catch (error) {
    console.error('Failed to cancel escrow:', error)
      showError(formatUserFriendlyError(error, 'cancel escrow'))
  } finally {
    cancelling.value = false
  }
}

const cancelEscrow = () => {
  showCancelConfirm()
}

const exchangeEscrow = async () => {
  if (!connected.value || !publicKey.value || !anchorWallet.value) {
    warning('Please connect your wallet first')
    return
  }

  // Validate recipient before attempting exchange
  const validation = canTakerExchange(
    escrow.value.recipientPubkey,
    escrow.value.onlyRecipient,
    publicKey.value
  )
  
  if (!validation.canExchange) {
    warning(validation.reason || 'You cannot fill this escrow')
    return
  }
  
  // Log recipient state for debugging
  console.log('Recipient validation:', {
    recipient: escrow.value.recipient || 'null',
    isSystemProgram: isPublicRecipient(escrow.value.recipientPubkey),
    onlyRecipient: escrow.value.onlyRecipient,
    taker: publicKey.value.toString()
  })

  exchanging.value = true

  try {
    // Calculate the amount to exchange
    const depositAmountToExchange = calculateDepositAmountToExchange({
      allowPartialFill: escrow.value.allowPartialFill,
      fillAmountPercent: fillAmountPercent.value,
      currentFillAmount: currentFillAmount.value,
      maxFillAmount: maxFillAmount.value,
      depositRemaining: escrow.value.depositRemaining,
      price: escrow.value.price
    })
    
    // Prepare exchange amounts
    const { depositAmountBN, requestAmountBN } = prepareExchangeAmounts({
      depositAmountToExchange,
      currentFillAmount: currentFillAmount.value,
      depositTokenDecimals: escrow.value.depositToken.decimals,
      requestTokenDecimals: escrow.value.requestToken.decimals
    })
    
    console.log('Exchange params:', {
      maker: escrow.value.maker,
      taker: publicKey.value.toString(),
      recipient: escrow.value.recipient,
      recipientPubkey: escrow.value.recipientPubkey?.toString(),
      recipientEqualsSystemProgram: isPublicRecipient(escrow.value.recipientPubkey),
      onlyRecipient: escrow.value.onlyRecipient,
      amount: depositAmountBN.toString(),
      requestAmount: requestAmountBN.toString(),
      escrowId: escrow.value.id
    })
    
    await exchangeEscrowTx({
      maker: escrow.value.maker,
      depositTokenMint: escrow.value.depositToken.mint,
      requestTokenMint: escrow.value.requestToken.mint,
      amount: depositAmountBN,
      requestAmount: requestAmountBN,
      seed: toBN(escrow.value.seed)
    })

    success('Exchange successful!')
    
    // Refresh request token balance and reload escrow
    await loadRequestTokenBalance()
    await loadEscrow() // Reload to update status
  } catch (error) {
    console.error('Failed to exchange escrow:', error)
    console.error('Escrow recipient:', escrow.value.recipient)
    console.error('Current user:', publicKey.value.toString())
    console.error('Only recipient flag:', escrow.value.onlyRecipient)
    
    // Use centralized error formatting
    showError(formatUserFriendlyError(error, 'exchange escrow'))
  } finally {
    exchanging.value = false
  }
}

onMounted(() => {
  loadEscrow()
})

watch(() => route.params.id, () => {
  loadEscrow()
})

watch([connected, publicKey], ([newConnected, newPublicKey]) => {
  if (newConnected && newPublicKey && escrow.value) {
    loadRequestTokenBalance()
    debouncedLoadExchangeCosts()
  }
})
</script>
