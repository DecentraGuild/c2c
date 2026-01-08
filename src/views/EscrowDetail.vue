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
      <div v-if="error" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
        {{ error }}
      </div>

      <!-- Loading State -->
      <BaseLoading v-if="loading" message="Loading escrow details..." />

      <!-- Escrow Details -->
      <div v-else-if="escrow" class="space-y-4">
        <!-- Exchange/Fill Section -->
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
            class="btn-secondary flex-1 py-3 disabled:opacity-50 min-h-[44px] text-sm sm:text-base"
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
import { FUND_TAKER_COSTS, TRANSACTION_COSTS } from '../utils/constants/fees'
import { BN } from '@coral-xyz/anchor'
import { SystemProgram, PublicKey } from '@solana/web3.js'
import ConfirmModal from '../components/ConfirmModal.vue'
import BaseShareModal from '../components/BaseShareModal.vue'
import BaseAddressDisplay from '../components/BaseAddressDisplay.vue'
import BaseTokenImage from '../components/BaseTokenImage.vue'
import TokenAmountDisplay from '../components/TokenAmountDisplay.vue'
import BaseLoading from '../components/BaseLoading.vue'
import EscrowPriceDisplay from '../components/EscrowPriceDisplay.vue'
import EscrowFillSection from '../components/EscrowFillSection.vue'
import EscrowDetailsSection from '../components/EscrowDetailsSection.vue'
import { useToast } from '../composables/useToast'
import { useDecimalHandling } from '../composables/useDecimalHandling'
import { useConfirmationModal } from '../composables/useConfirmationModal'
import { useShareModal } from '../composables/useShareModal'
import { canUserExchangeEscrow } from '../utils/escrowValidation'
import { debounce } from '../utils/debounce'

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
const exchangeCosts = ref(null)
const loadingExchangeCosts = ref(false)

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
  
  // Only apply restrictions for 0-decimal tokens
  if (escrow.value && escrow.value.requestToken.decimals === 0) {
    // Remove decimal point and everything after it
    if (amountValue.includes('.')) {
      amountValue = amountValue.split('.')[0]
      if (inputElement) {
        const cursorPos = inputElement.selectionStart
        inputElement.value = amountValue
        const newPos = Math.min(cursorPos - 1, amountValue.length)
        setTimeout(() => {
          inputElement.setSelectionRange(newPos, newPos)
        }, 0)
      }
    }
    // Ensure it's a valid integer
    const numValue = parseFloat(amountValue)
    if (!isNaN(numValue)) {
      const intValue = Math.floor(Math.abs(numValue)).toString()
      if (intValue !== amountValue) {
        amountValue = intValue
        if (inputElement) {
          inputElement.value = amountValue
        }
      }
    }
  } else {
    // For tokens with decimals, validate the format
    const validPattern = /^[0-9]*\.?[0-9]*$/
    if (!validPattern.test(amountValue)) {
      // Remove invalid characters
      amountValue = amountValue.replace(/[^0-9.]/g, '')
      // Ensure only one decimal point
      const parts = amountValue.split('.')
      if (parts.length > 2) {
        amountValue = parts[0] + '.' + parts.slice(1).join('')
      }
      if (inputElement) {
        const cursorPos = inputElement.selectionStart
        inputElement.value = amountValue
        setTimeout(() => {
          inputElement.setSelectionRange(cursorPos, cursorPos)
        }, 0)
      }
    }
  }
  
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
  // For tokens with 0 decimals, prevent decimal point and invalid characters
  if (escrow.value && escrow.value.requestToken.decimals === 0) {
    if (event.key === '.' || event.key === ',' || event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
      event.preventDefault()
      return false
    }
  } else {
    // For tokens with decimals, allow decimal point but prevent multiple
    if (event.key === '.' && event.target.value.includes('.')) {
      event.preventDefault()
      return false
    }
    // Prevent scientific notation and other invalid characters
    if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
      event.preventDefault()
      return false
    }
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

// Calculate exchange costs
const loadExchangeCosts = async () => {
  if (!escrow.value || !connected.value || !publicKey.value) {
    exchangeCosts.value = null
    return
  }

  loadingExchangeCosts.value = true
  try {
    const costs = await calculateExchangeCosts({
      taker: publicKey.value,
      depositTokenMint: escrow.value.depositToken.mint,
      requestTokenMint: escrow.value.requestToken.mint,
      connection
    })
    exchangeCosts.value = costs
  } catch (error) {
    console.error('Failed to calculate exchange costs:', error)
    exchangeCosts.value = null
  } finally {
    loadingExchangeCosts.value = false
  }
}

// Debounced version - waits 300ms after last call before executing
// This prevents excessive API calls when values change rapidly
const debouncedLoadExchangeCosts = debounce(loadExchangeCosts, 300)

// Watch escrow changes to reset fill amount and load balance
watch(() => escrow.value, (newEscrow) => {
  if (newEscrow) {
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
    new PublicKey(escrowId.value)
  } catch (err) {
    error.value = 'Invalid escrow ID format'
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
      }
    })

    // Calculate amounts
    const depositRemaining = fromSmallestUnits(
      escrowAccount.tokensDepositRemaining.toString(),
      depositTokenInfo.decimals
    )
    const depositInitial = fromSmallestUnits(
      escrowAccount.tokensDepositInit.toString(),
      depositTokenInfo.decimals
    )
    
    console.debug('Escrow amounts calculated:', {
      depositInitialRaw: escrowAccount.tokensDepositInit.toString(),
      depositInitialDisplay: depositInitial,
      depositRemainingRaw: escrowAccount.tokensDepositRemaining.toString(),
      depositRemainingDisplay: depositRemaining,
      decimalsUsed: depositTokenInfo.decimals
    })
    const requestAmount = depositRemaining * escrowAccount.price

    // Determine status
    const isFilled = escrowAccount.tokensDepositRemaining.toString() === '0'
    const expireTimestampNum = escrowAccount.expireTimestamp.toNumber()
    const isExpired = expireTimestampNum > 0 && expireTimestampNum < Math.floor(Date.now() / 1000)
    const status = isFilled ? 'filled' : (isExpired ? 'expired' : 'active')

    // Handle recipient - keep both PublicKey and string for different uses
    const recipientPubkey = escrowAccount.recipient
    const SYSTEM_PROGRAM_ID = SystemProgram.programId
    const isPublicRecipient = !recipientPubkey || recipientPubkey.equals(SYSTEM_PROGRAM_ID)
    
    // Log the actual escrow state for debugging
    console.log('Loaded escrow recipient state:', {
      recipient: recipientPubkey?.toString() || 'null',
      recipientIsSystemProgram: recipientPubkey?.equals(SYSTEM_PROGRAM_ID) || false,
      onlyRecipient: escrowAccount.onlyRecipient,
      isPublicRecipient,
      escrowId: escrowPubkey.toString()
    })
    
    // Store recipient as string for display, but keep PublicKey for validation
    let recipientStr = null
    if (recipientPubkey && !isPublicRecipient) {
      recipientStr = recipientPubkey.toString()
    }

    escrow.value = {
      id: escrowPubkey.toString(),
      publicKey: escrowPubkey,
      maker: escrowAccount.maker.toString(),
      depositToken: depositTokenInfo,
      requestToken: requestTokenInfo,
      depositAmount: depositInitial,
      depositRemaining: depositRemaining,
      depositAmountRaw: escrowAccount.tokensDepositInit.toString(),
      depositRemainingRaw: escrowAccount.tokensDepositRemaining.toString(),
      requestAmount: requestAmount,
      price: escrowAccount.price,
      seed: escrowAccount.seed.toString(),
      expireTimestamp: expireTimestampNum,
      recipient: recipientStr,
      recipientPubkey: recipientPubkey, // Keep original PublicKey for program validation
      onlyRecipient: escrowAccount.onlyRecipient,
      onlyWhitelist: escrowAccount.onlyWhitelist,
      allowPartialFill: escrowAccount.allowPartialFill,
      whitelist: escrowAccount.whitelist?.toString() || null,
      status
    }

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
    error.value = err.message || 'Failed to load escrow'
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
    const seedBN = new BN(escrow.value.seed)
    
    await cancelEscrowTx({
      depositTokenMint: escrow.value.depositToken.mint,
      requestTokenMint: escrow.value.requestToken.mint,
      seed: seedBN
    })

    success('Escrow cancelled successfully!')
    router.push('/manage')
  } catch (error) {
    console.error('Failed to cancel escrow:', error)
    showError(error.message || 'Failed to cancel escrow')
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
  // Use PublicKey comparison like the program does
  const recipientPubkey = escrow.value.recipientPubkey
  const SYSTEM_PROGRAM_ID = SystemProgram.programId
  const takerPubkey = publicKey.value
  const isPublicRecipient = !recipientPubkey || recipientPubkey.equals(SYSTEM_PROGRAM_ID)
  
  // The program validates recipient - if recipient is set (not SystemProgram), taker must match
  // Note: If recipient is SystemProgram and onlyRecipient is true, this is an invalid state
  // but we'll still attempt the exchange as SystemProgram means "public"
  if (recipientPubkey && !isPublicRecipient) {
    if (escrow.value.onlyRecipient && !recipientPubkey.equals(takerPubkey)) {
      warning(`This escrow can only be filled by: ${truncateAddress(recipientPubkey.toString())}`)
      return
    }
  }
  
  // Log recipient state for debugging
  console.log('Recipient validation:', {
    recipient: recipientPubkey?.toString() || 'null',
    isSystemProgram: isPublicRecipient,
    onlyRecipient: escrow.value.onlyRecipient,
    taker: takerPubkey.toString()
  })

  exchanging.value = true

  try {
    // Calculate the amount to exchange
    // For partial fill, use the fill amount converted to deposit token units
    // For full fill, use the exact remaining deposit amount (avoids slippage issues)
    let depositAmountToExchange
    
    if (escrow.value.allowPartialFill) {
      // Check if this is effectively a full fill
      // Compare with a small tolerance to account for floating point precision
      const tolerance = 0.0001
      const isFullFill = fillAmountPercent.value >= 99.99 || 
                        Math.abs(currentFillAmount.value - maxFillAmount.value) < tolerance ||
                        (maxFillAmount.value > 0 && currentFillAmount.value >= maxFillAmount.value * (1 - tolerance))
      
      if (isFullFill) {
        // For full fill, use exact remaining deposit from escrow to avoid slippage
        // This ensures we use the exact amount stored on-chain
        depositAmountToExchange = escrow.value.depositRemaining
      } else {
        // Partial fill - convert fill amount (request token) to deposit token amount
        depositAmountToExchange = currentFillAmount.value / escrow.value.price
      }
    } else {
      // Full fill - use remaining deposit
      depositAmountToExchange = escrow.value.depositRemaining
    }
    
    // Convert to smallest units
    const depositAmountRaw = toSmallestUnits(
      depositAmountToExchange.toString(),
      escrow.value.depositToken.decimals
    )
    const amountBN = new BN(depositAmountRaw.toString())
    
    // Calculate request amount needed (for wrapped SOL handling)
    const requestAmountRaw = toSmallestUnits(
      currentFillAmount.value.toString(),
      escrow.value.requestToken.decimals
    )
    const requestAmountBN = new BN(requestAmountRaw.toString())
    
    console.log('Exchange params:', {
      maker: escrow.value.maker,
      taker: publicKey.value.toString(),
      recipient: escrow.value.recipient,
      recipientPubkey: escrow.value.recipientPubkey?.toString(),
      recipientEqualsSystemProgram: escrow.value.recipientPubkey?.equals(SystemProgram.programId),
      onlyRecipient: escrow.value.onlyRecipient,
      amount: amountBN.toString(),
      requestAmount: requestAmountBN.toString(),
      escrowId: escrow.value.id
    })
    
    await exchangeEscrowTx({
      maker: escrow.value.maker,
      depositTokenMint: escrow.value.depositToken.mint,
      requestTokenMint: escrow.value.requestToken.mint,
      amount: amountBN,
      requestAmount: requestAmountBN,
      seed: new BN(escrow.value.seed)
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
    
    // Provide more helpful error message for recipient errors
    if (error.message && (error.message.includes('6004') || error.message.includes('EscrowRecipientError'))) {
      const recipientInfo = escrow.value.recipientPubkey 
        ? `Recipient: ${truncateAddress(escrow.value.recipientPubkey.toString())}` 
        : 'Recipient: Public (SystemProgram)'
      showError(`Recipient validation failed (Error 6004). ${recipientInfo}`)
    } else {
      showError(error.message || 'Failed to exchange escrow')
    }
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
