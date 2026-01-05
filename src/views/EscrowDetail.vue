<template>
  <div class="min-h-screen bg-primary-bg py-4 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header with Back Button -->
      <div class="flex items-center gap-4 mb-6">
        <button
          @click="$router.back()"
          class="p-2 hover:bg-secondary-bg rounded-xl transition-colors"
        >
          <Icon icon="mdi:arrow-left" class="w-6 h-6 text-text-primary" />
        </button>
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-text-primary mb-1">Offer</h1>
          <p class="text-sm text-text-muted font-mono">{{ truncateAddress(escrowId) }}</p>
        </div>
        <button
          @click="showShareModal()"
          class="p-2 hover:bg-secondary-bg rounded-xl transition-colors"
          title="Share escrow"
        >
          <Icon icon="mdi:share-variant" class="w-6 h-6 text-text-muted hover:text-text-primary" />
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
        {{ error }}
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="card text-center py-12">
        <Icon icon="svg-spinners:ring-resize" class="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
        <p class="text-text-secondary">Loading escrow details...</p>
      </div>

      <!-- Escrow Details -->
      <div v-else-if="escrow" class="space-y-4">
        <!-- Price Display Card -->
        <div class="card">
          <h2 class="text-sm font-semibold text-text-primary mb-2 text-center">Price</h2>
          <div class="bg-secondary-bg/50 rounded-xl p-3 space-y-2">
            <!-- Price Line 1: 1 depositToken = price * requestToken -->
            <div class="grid grid-cols-[1fr_auto_1fr] items-center text-sm text-text-secondary">
              <div class="flex justify-end pr-3">
                <TokenAmountDisplay
                  v-if="escrow.depositToken"
                  :token="escrow.depositToken"
                  :amount="1"
                  :decimals="escrow.depositToken.decimals"
                  icon-size="sm"
                  amount-class="text-text-secondary whitespace-nowrap"
                  ticker-class="text-text-secondary whitespace-nowrap"
                />
              </div>
              <div class="flex justify-center flex-shrink-0 px-2">
                <Icon icon="mdi:arrow-left-right" class="w-5 h-5 text-text-primary" />
              </div>
              <div class="flex justify-start pl-3">
                <TokenAmountDisplay
                  v-if="escrow.requestToken"
                  :token="escrow.requestToken"
                  :amount="escrow.price"
                  :decimals="escrow.requestToken.decimals"
                  icon-size="sm"
                  amount-class="text-text-secondary whitespace-nowrap"
                  ticker-class="text-text-secondary whitespace-nowrap"
                />
              </div>
            </div>
            
            <!-- Price Line 2: 1 requestToken = 1/price * depositToken -->
            <div class="grid grid-cols-[1fr_auto_1fr] items-center text-sm text-text-secondary">
              <div class="flex justify-end pr-3">
                <TokenAmountDisplay
                  v-if="escrow.requestToken"
                  :token="escrow.requestToken"
                  :amount="1"
                  :decimals="escrow.requestToken.decimals"
                  icon-size="sm"
                  amount-class="text-text-secondary whitespace-nowrap"
                  ticker-class="text-text-secondary whitespace-nowrap"
                />
              </div>
              <div class="flex justify-center flex-shrink-0 px-2">
                <Icon icon="mdi:arrow-left-right" class="w-5 h-5 text-text-primary" />
              </div>
              <div class="flex justify-start pl-3">
                <TokenAmountDisplay
                  v-if="escrow.depositToken"
                  :token="escrow.depositToken"
                  :amount="1 / escrow.price"
                  :decimals="escrow.depositToken.decimals"
                  icon-size="sm"
                  amount-class="text-text-secondary whitespace-nowrap"
                  ticker-class="text-text-secondary whitespace-nowrap"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Exchange/Fill Section -->
        <div v-if="escrow && escrow.status === 'active'" class="card space-y-4">
          <h2 class="text-lg font-bold text-text-primary">Fill Escrow</h2>
          
          <!-- Wallet Balance Display -->
          <div class="bg-secondary-bg/50 rounded-xl p-3">
            <div class="grid grid-cols-2 gap-4 items-center">
              <span class="text-sm text-text-muted text-left">Your {{ escrow.requestToken.symbol || 'Token' }} Balance:</span>
              <span v-if="loadingRequestTokenBalance" class="text-text-muted text-sm text-left whitespace-nowrap">Loading...</span>
              <TokenAmountDisplay
                v-else
                :token="escrow.requestToken"
                :amount="requestTokenBalance"
                :decimals="escrow.requestToken.decimals"
                icon-size="sm"
                container-class="text-left"
              />
            </div>
          </div>

          <!-- Partial Fill Input/Slider -->
          <div v-if="escrow.allowPartialFill" class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm font-semibold text-text-primary">Amount to Fill</label>
              <div class="text-xs text-text-muted">
                Max: 
                <TokenAmountDisplay
                  :token="escrow.requestToken"
                  :amount="maxFillAmount"
                  :decimals="escrow.requestToken.decimals"
                  icon-size="xs"
                  container-class="inline-flex"
                  amount-class="text-text-muted text-xs"
                  ticker-class="text-text-muted text-xs"
                />
              </div>
            </div>
            
            <!-- Slider -->
            <div class="space-y-2">
              <input
                v-model.number="fillAmountPercent"
                type="range"
                min="0"
                max="100"
                step="1"
                class="w-full h-2 bg-secondary-bg rounded-lg appearance-none cursor-pointer accent-primary-color"
              />
              <div class="flex justify-between text-xs text-text-muted">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <!-- Amount Input -->
            <div>
              <label class="text-sm text-text-muted mb-1 block">Fill Amount</label>
              <div class="relative">
                <input
                  v-model="fillAmount"
                  type="number"
                  :step="getStepForDecimals(escrow.requestToken.decimals)"
                  :min="0"
                  :max="maxFillAmount"
                  :placeholder="getPlaceholderForDecimals(escrow.requestToken.decimals)"
                  class="input-field w-full pr-20"
                  @input="updateFillAmountFromInput"
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                  {{ escrow.requestToken.symbol || 'Token' }}
                </div>
              </div>
              <div class="flex gap-2 mt-2">
                <button
                  v-for="percentage in [25, 50, 75, 100]"
                  :key="percentage"
                  @click="setFillPercentage(percentage)"
                  class="px-3 py-1 text-xs font-medium rounded bg-secondary-bg/50 text-text-secondary hover:bg-secondary-bg transition-colors"
                >
                  {{ percentage }}%
                </button>
              </div>
            </div>

            <!-- Expected Receive -->
            <div class="bg-secondary-bg/50 rounded-xl p-3">
              <div class="grid grid-cols-2 gap-4 items-center">
                <span class="text-sm text-text-muted text-left">You will receive:</span>
                <TokenAmountDisplay
                  :token="escrow.depositToken"
                  :amount="expectedReceiveAmount"
                  :decimals="escrow.depositToken.decimals"
                  icon-size="sm"
                  container-class="text-left"
                />
              </div>
            </div>
          </div>

          <!-- Full Fill Display (when partial fill disabled) -->
          <div v-else class="bg-secondary-bg/50 rounded-xl p-3 space-y-2">
            <div class="grid grid-cols-2 gap-4 items-center">
              <span class="text-sm text-text-muted text-left">You will pay:</span>
              <TokenAmountDisplay
                :token="escrow.requestToken"
                :amount="escrow.requestAmount"
                :decimals="escrow.requestToken.decimals"
                icon-size="sm"
                container-class="text-left"
              />
            </div>
            <div class="grid grid-cols-2 gap-4 items-center">
              <span class="text-sm text-text-muted text-left">You will receive:</span>
              <TokenAmountDisplay
                :token="escrow.depositToken"
                :amount="escrow.depositRemaining"
                :decimals="escrow.depositToken.decimals"
                icon-size="sm"
                container-class="text-left"
              />
            </div>
          </div>

          <!-- Transaction Fee Info -->
          <div v-if="exchangeCosts" class="bg-secondary-bg/50 rounded-xl p-3 border border-border-color/50">
            <div class="grid grid-cols-2 gap-4 items-center mb-1">
              <span class="text-sm text-text-muted text-left">Transaction fee:</span>
              <span class="text-text-primary font-semibold text-left whitespace-nowrap">
                {{ formatBalance(exchangeCosts.totalCost, 9) }} SOL
              </span>
            </div>
            <div v-if="exchangeCosts.totalCost > 0" class="text-xs text-text-muted mt-1">
              <span v-if="exchangeCosts.takerAtaCost > 0 || exchangeCosts.takerReceiveAtaCost > 0">
                Includes account creation costs
              </span>
            </div>
          </div>

          <!-- Exchange Button -->
          <button
            @click="exchangeEscrow"
            :disabled="exchanging || !canFill || !canExchange"
            class="btn-primary w-full py-3 disabled:opacity-50"
          >
            <Icon v-if="exchanging" icon="svg-spinners:ring-resize" class="w-5 h-5 inline mr-2" />
            <Icon v-else icon="mdi:swap-horizontal" class="w-5 h-5 inline mr-2" />
            {{ escrow.allowPartialFill ? 'FILL ESCROW' : 'EXCHANGE' }}
          </button>
        </div>

        <!-- Cancel/Claim Button -->
        <div v-if="canCancel" class="flex flex-col sm:flex-row gap-3">
          <button
            @click="cancelEscrow"
            :disabled="cancelling"
            class="btn-secondary flex-1 py-3 disabled:opacity-50"
          >
            <Icon v-if="cancelling" icon="svg-spinners:ring-resize" class="w-5 h-5 inline mr-2" />
            <Icon v-else :icon="escrow.status === 'filled' ? 'mdi:check-circle' : 'mdi:close'" class="w-5 h-5 inline mr-2" />
            {{ escrow.status === 'filled' ? 'COMPLETE' : 'CANCEL/CLOSE' }}
          </button>
        </div>

        <!-- Escrow Details Card -->
        <div class="card space-y-4">
          <button
            @click="showEscrowDetails = !showEscrowDetails"
            class="flex items-center justify-between w-full text-left"
          >
            <h2 class="text-lg font-bold text-text-primary">Escrow Details</h2>
            <Icon 
              :icon="showEscrowDetails ? 'mdi:chevron-up' : 'mdi:chevron-down'" 
              class="w-6 h-6 text-text-muted transition-transform"
            />
          </button>
          
          <div v-show="showEscrowDetails" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-text-muted mb-1 block">Escrow</label>
              <BaseAddressDisplay :address="escrow.id" />
            </div>
            <div>
              <label class="text-sm text-text-muted mb-1 block">Maker</label>
              <BaseAddressDisplay :address="escrow.maker" />
            </div>
            <div>
              <label class="text-sm text-text-muted mb-1 block">Deposited</label>
              <BaseAddressDisplay :address="escrow.depositToken.mint" />
            </div>
            <div>
              <label class="text-sm text-text-muted mb-1 block">Request</label>
              <BaseAddressDisplay :address="escrow.requestToken.mint" />
            </div>
            <div>
              <label class="text-sm text-text-muted">Deposit amount</label>
              <div class="text-text-primary text-sm">
                <TokenAmountDisplay
                  :token="escrow.depositToken"
                  :amount="escrow.depositAmount"
                  :decimals="escrow.depositToken.decimals"
                  icon-size="sm"
                  amount-class="text-text-primary text-sm"
                  ticker-class="text-text-primary text-sm"
                />
              </div>
            </div>
            <div>
              <label class="text-sm text-text-muted">Remaining amount</label>
              <div class="text-text-primary text-sm space-y-1">
                <TokenAmountDisplay
                  :token="escrow.depositToken"
                  :amount="escrow.depositRemaining"
                  :decimals="escrow.depositToken.decimals"
                  icon-size="sm"
                  amount-class="text-text-primary text-sm"
                  ticker-class="text-text-primary text-sm"
                />
                <TokenAmountDisplay
                  :token="escrow.requestToken"
                  :amount="escrow.depositRemaining * escrow.price"
                  :decimals="escrow.requestToken.decimals"
                  icon-size="sm"
                  amount-class="text-text-primary text-sm"
                  ticker-class="text-text-primary text-sm"
                />
                <span class="text-text-primary text-sm">{{ remainingPercentage }}%</span>
              </div>
            </div>
            <div>
              <label class="text-sm text-text-muted">Price</label>
              <div class="text-text-primary text-sm">
                <TokenAmountDisplay
                  :token="escrow.requestToken"
                  :amount="escrow.price"
                  :decimals="escrow.requestToken.decimals"
                  icon-size="sm"
                  amount-class="text-text-primary text-sm"
                  ticker-class="text-text-primary text-sm"
                />
              </div>
            </div>
            <div>
              <label class="text-sm text-text-muted mb-1 block">Recipient</label>
              <p v-if="isPublicEscrow" class="text-text-primary text-sm">Any wallet</p>
              <BaseAddressDisplay v-else :address="escrow.recipient" />
            </div>
          </div>

          <!-- Flags -->
          <div v-show="showEscrowDetails" class="flex flex-wrap gap-2 pt-4 border-t border-border-color">
            <span
              :class="[
                'px-3 py-1 rounded-lg text-xs font-semibold',
                escrow.allowPartialFill ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'
              ]"
            >
              Partial fill: {{ escrow.allowPartialFill ? 'yes' : 'no' }}
            </span>
            <span
              :class="[
                'px-3 py-1 rounded-lg text-xs font-semibold',
                !escrow.recipient || escrow.recipient === '11111111111111111111111111111111' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-gray-500/20 text-gray-400'
              ]"
            >
              Public: {{ !escrow.recipient || escrow.recipient === '11111111111111111111111111111111' ? 'yes' : 'no' }}
            </span>
            <span
              :class="[
                'px-3 py-1 rounded-lg text-xs font-semibold',
                escrow.expireTimestamp > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-400'
              ]"
            >
              Expire timestamp: {{ escrow.expireTimestamp > 0 ? formatTimestamp(escrow.expireTimestamp * 1000) : 'never' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Not Found -->
      <div v-else class="card text-center py-12">
        <Icon icon="mdi:alert-circle-outline" class="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
        <p class="text-text-secondary">Escrow not found</p>
        <p class="text-sm text-text-muted mt-2">The escrow you're looking for doesn't exist or has been closed.</p>
      </div>
    </div>

    <!-- Confirmation Modal (only for cancel/claim) -->
    <ConfirmModal
      v-model:show="showConfirm"
      :title="confirmTitle"
      :message="confirmMessage"
      :loading="cancelling"
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
import { DECIMAL_CONSTANTS } from '../utils/constants'
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
import { useToast } from '../composables/useToast'

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

// State
const escrowId = computed(() => route.params.id)
const loading = ref(true)
const error = ref(null)
const escrow = ref(null)
const showShare = ref(false)
const shareUrl = ref('')
const cancelling = ref(false)
const exchanging = ref(false)
const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const pendingAction = ref(null)
const showEscrowDetails = ref(false)

// Fill/Exchange state
const fillAmountPercent = ref(100)
const fillAmount = ref('')
const exchangeCosts = ref(null)
const loadingExchangeCosts = ref(false)

// Computed
const remainingPercentage = computed(() => {
  if (!escrow.value) return 0
  return formatDecimals((escrow.value.depositRemaining / escrow.value.depositAmount) * 100)
})

const canCancel = computed(() => {
  if (!escrow.value || !connected.value || !publicKey.value) return false
  return escrow.value.maker === publicKey.value.toString()
})

const canExchange = computed(() => {
  if (!escrow.value || !connected.value || !publicKey.value) return false
  
  // Can't exchange if you're the maker
  if (escrow.value.maker === publicKey.value.toString()) return false
  
  // Escrow must be active
  if (escrow.value.status !== 'active') return false
  
  // Check recipient restriction
  const NULL_ADDRESS = '11111111111111111111111111111111'
  const SYSTEM_PROGRAM = '11111111111111111111111111111111' // SystemProgram.programId is all 1s
  const isPublic = !escrow.value.recipient || 
                  escrow.value.recipient === NULL_ADDRESS || 
                  escrow.value.recipient === SYSTEM_PROGRAM
  
  // If escrow has a recipient and onlyRecipient is true, taker must match recipient
  if (escrow.value.recipient && escrow.value.onlyRecipient) {
    return escrow.value.recipient === publicKey.value.toString()
  }
  
  // If escrow has a recipient but onlyRecipient is false, anyone can fill (but program may still check)
  // For now, allow if public or if recipient matches
  if (escrow.value.recipient && !isPublic) {
    // The program will validate this, but we can show UI feedback
    // Allow it and let the program reject if wrong
    return true
  }
  
  // Public escrow - anyone can fill
  return true
})

const isPublicEscrow = computed(() => {
  if (!escrow.value) return false
  const NULL_ADDRESS = '11111111111111111111111111111111'
  return !escrow.value.recipient || escrow.value.recipient === NULL_ADDRESS
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
const getStepForDecimals = (decimals) => {
  const maxDecimals = Math.min(decimals - 1, DECIMAL_CONSTANTS.MAX_STEP_DECIMALS - 1)
  return `0.${'0'.repeat(maxDecimals)}1`
}

const getPlaceholderForDecimals = (decimals) => {
  const displayDecimals = Math.min(decimals, DECIMAL_CONSTANTS.MAX_DISPLAY_DECIMALS)
  return `0.${'0'.repeat(displayDecimals)}`
}

const setFillPercentage = (percentage) => {
  fillAmountPercent.value = percentage
  const amount = (maxFillAmount.value * percentage) / 100
  fillAmount.value = formatDecimals(amount)
}

const updateFillAmountFromInput = () => {
  if (!escrow.value || !fillAmount.value) {
    fillAmountPercent.value = 0
    return
  }
  
  const amount = parseFloat(fillAmount.value)
  if (isNaN(amount) || maxFillAmount.value === 0) {
    fillAmountPercent.value = 0
    return
  }
  
  fillAmountPercent.value = Math.min(100, Math.max(0, (amount / maxFillAmount.value) * 100))
}

// Watch fillAmountPercent to update fillAmount
watch(fillAmountPercent, (newPercent) => {
  if (escrow.value && escrow.value.allowPartialFill) {
    const amount = (maxFillAmount.value * newPercent) / 100
    fillAmount.value = formatDecimals(amount)
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

// Watch escrow changes to reset fill amount and load balance
watch(() => escrow.value, (newEscrow) => {
  if (newEscrow) {
    // Load the request token balance
    loadRequestTokenBalance()
    
    // Load exchange costs
    loadExchangeCosts()
    
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

    // Calculate amounts
    const depositRemaining = fromSmallestUnits(
      escrowAccount.tokensDepositRemaining.toString(),
      depositTokenInfo.decimals
    )
    const depositInitial = fromSmallestUnits(
      escrowAccount.tokensDepositInit.toString(),
      depositTokenInfo.decimals
    )
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
  } catch (err) {
    console.error('Failed to load escrow:', err)
    error.value = err.message || 'Failed to load escrow'
  } finally {
    loading.value = false
  }
}

const showShareModal = () => {
  shareUrl.value = `${window.location.origin}/escrow/${escrowId.value}`
  showShare.value = true
}

const showCancelConfirm = () => {
  if (!connected.value || !publicKey.value || !anchorWallet.value) {
    warning('Please connect your wallet first')
    return
  }

  confirmTitle.value = escrow.value.status === 'filled' ? 'Complete Escrow' : 'Cancel Escrow'
  confirmMessage.value = escrow.value.status === 'filled' 
    ? 'This will close the escrow account and recover the account rent (SOL). Tokens have already been received automatically when the escrow was filled.'
    : 'Are you sure you want to cancel this escrow? This action cannot be undone.'
  pendingAction.value = executeCancel
  showConfirm.value = true
}

const handleConfirmAction = async () => {
  if (pendingAction.value) {
    await pendingAction.value()
  }
  showConfirm.value = false
  pendingAction.value = null
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
    // For full fill, use the remaining deposit amount
    let depositAmountToExchange
    
    if (escrow.value.allowPartialFill) {
      // Convert fill amount (request token) to deposit token amount
      depositAmountToExchange = currentFillAmount.value / escrow.value.price
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
    
    console.log('Exchange params:', {
      maker: escrow.value.maker,
      taker: publicKey.value.toString(),
      recipient: escrow.value.recipient,
      recipientPubkey: escrow.value.recipientPubkey?.toString(),
      recipientEqualsSystemProgram: escrow.value.recipientPubkey?.equals(SystemProgram.programId),
      onlyRecipient: escrow.value.onlyRecipient,
      amount: amountBN.toString(),
      escrowId: escrow.value.id
    })
    
    await exchangeEscrowTx({
      maker: escrow.value.maker,
      depositTokenMint: escrow.value.depositToken.mint,
      requestTokenMint: escrow.value.requestToken.mint,
      amount: amountBN,
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
    loadExchangeCosts()
  }
})
</script>
