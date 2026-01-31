<template>
  <div class="min-h-screen bg-primary-bg py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-4">
        <h1 class="text-base sm:text-lg font-bold text-text-primary mb-1">CREATE ESCROW</h1>
        <p class="text-xs text-text-secondary">Secure SPL token escrow for Solana</p>
      </div>

      <!-- Main Card -->
      <div class="card space-y-2.5">
        <!-- Offer Section -->
        <TokenAmountSelector
          type="offer"
          v-model:token="offerToken"
          v-model:amount="offerAmount"
          :show-balance="false"
        />

        <!-- Request Section -->
        <TokenAmountSelector
          type="request"
          v-model:token="requestToken"
          v-model:amount="requestAmount"
          :show-balance="false"
        />

        <!-- Price Display -->
        <PriceDisplay
          :offer-token="offerToken"
          :request-token="requestToken"
          :offer-amount="offerAmount"
          :request-amount="requestAmount"
        />

        <!-- Additional Settings -->
        <AdditionalSettings
          v-model:direct="settingsDirect"
          v-model:directAddress="settingsDirectAddress"
          v-model:whitelist="settingsWhitelist"
          v-model:whitelistAddresses="settingsWhitelistAddresses"
          v-model:expire="settingsExpire"
          v-model:expireDate="settingsExpireDate"
          v-model:partialFill="settingsPartialFill"
          v-model:slippage="settingsSlippage"
        />

        <!-- Error Message -->
        <div v-if="displayError" class="p-2.5 bg-status-error/10 border border-status-error/20 rounded-lg text-xs sm:text-sm text-status-error">
          {{ displayError }}
        </div>

        <!-- Action Button -->
        <div class="pt-1.5">
          <button 
            @click="handleCreateEscrow"
            :disabled="!canSubmit || loading"
            class="btn-primary w-full py-2.5 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px]"
          >
            <span v-if="loading">Creating Escrow...</span>
            <span v-else>Create Escrow</span>
          </button>
        </div>

        <!-- Transaction Cost Breakdown -->
        <div class="pt-1.5 border-t border-border-color">
          <div v-if="costBreakdown" class="space-y-1">
            <div class="text-xs text-text-muted mb-1">Transaction Costs</div>
            <div class="space-y-0.5">
              <!-- Solana Token Accounts (includes all recoverable accounts) -->
              <div
                v-for="item in costBreakdown.items.filter(item => item.label.includes('Solana Token Accounts'))"
                :key="item.label"
                class="flex items-center justify-between text-xs"
              >
                <span class="text-text-secondary">Solana Token Accounts</span>
                <span class="text-text-primary font-medium">{{ formatDecimals(item.amount) }} SOL</span>
              </div>
              <!-- Escrow Fee -->
              <div
                v-for="item in costBreakdown.items.filter(item => item.label.includes('Escrow fee'))"
                :key="item.label"
                class="flex items-center justify-between text-xs"
              >
                <span class="text-text-secondary">Escrow Fee</span>
                <span class="text-text-primary font-medium">{{ formatDecimals(item.amount) }} SOL</span>
              </div>
            </div>
            <div class="pt-1 border-t border-border-color/50 flex items-center justify-between">
              <span class="text-text-primary font-semibold text-xs">Total Costs</span>
              <span class="text-text-primary font-bold text-xs">{{ formatDecimals(costBreakdown.total) }} SOL</span>
            </div>
            <!-- Deposit -->
            <div v-if="offerToken && offerAmount" class="pt-1 border-t border-border-color/50 flex items-center justify-between text-xs">
              <span class="text-text-primary font-semibold">Deposit</span>
              <div class="flex items-center gap-1.5">
                <span class="text-text-primary font-bold">{{ formatDecimals(offerAmount) }}</span>
                <span class="text-text-primary font-medium">{{ offerToken.symbol || 'TOKEN' }}</span>
              </div>
            </div>
            <div class="text-xs text-text-muted pt-1">
              <button
                @click="showPricing = true"
                class="hover:underline inline link-red"
              >
                See pricelist
              </button>
            </div>
          </div>
          <div v-else-if="loadingCosts" class="text-xs text-text-muted flex items-center gap-2">
            <Icon icon="svg-spinners:ring-resize" class="w-3 h-3" />
            <span>Calculating costs...</span>
          </div>
          <div v-else class="text-xs text-text-muted">
            Select tokens to see your fee or 
            <button
              @click="showPricing = true"
              class="hover:underline inline link-red"
            >
              click here for pricing
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing Modal -->
    <PricingModal v-model:show="showPricing" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { useWallet, useAnchorWallet } from 'solana-wallets-vue'
import { BN } from '@coral-xyz/anchor'
import { SystemProgram, PublicKey } from '@solana/web3.js'
import TokenAmountSelector from '../components/TokenAmountSelector.vue'
import PriceDisplay from '../components/PriceDisplay.vue'
import AdditionalSettings from '../components/AdditionalSettings.vue'
import PricingModal from '../components/PricingModal.vue'
import { useEscrowStore } from '../stores/escrow'
import { useEscrowFormStore } from '../stores/escrowForm'
import { useCollectionStore } from '../stores/collection'
import { useEscrowTransactions } from '../composables/useEscrowTransactions'
import { useSolanaConnection } from '../composables/useSolanaConnection'
import { useErrorDisplay } from '../composables/useErrorDisplay'
import { toSmallestUnits, formatDecimals } from '../utils/formatters'
import { useDebounce } from '../composables/useDebounce'
import { DEBOUNCE_DELAYS } from '../utils/constants/ui'
import { CONTRACT_FEE_ACCOUNT } from '../utils/constants'
import { ESCROW_PROGRAM_ID, SLIPPAGE_DIVISOR } from '../utils/constants/escrow'
import { calculateEscrowCreationCosts } from '../utils/transactionCosts'
import { useTransactionCosts } from '../composables/useTransactionCosts'
import { deriveEscrowAccounts } from '../utils/escrowTransactions'
import { validateRecipientAddress } from '../utils/recipientValidation'
import { toBN, toPublicKey } from '../utils/solanaUtils'
import { useWalletValidation } from '../composables/useWalletValidation'
import { formatUserFriendlyError } from '../utils/errorMessages'
import { logError } from '../utils/logger'

const router = useRouter()
const escrowStore = useEscrowStore()
const formStore = useEscrowFormStore()
const collectionStore = useCollectionStore()
const walletAdapter = useWallet()
const anchorWallet = useAnchorWallet() // Get Anchor-compatible wallet
const { publicKey, connected } = walletAdapter
const connection = useSolanaConnection()
const { initializeEscrow, loading: txLoading, error: txError } = useEscrowTransactions()
const { validateWallet: validateWalletReady } = useWalletValidation()
const { displayError } = useErrorDisplay({ txError, errorTypes: ['transaction', 'form'] })

// Get selected collection for marketplace fee calculation
const selectedCollection = computed(() => collectionStore.selectedCollection)

const loading = ref(false)
const showPricing = ref(false)

const canSubmit = computed(() => {
  // Ensure Anchor wallet is available for transaction building
  return formStore.isFormValid && 
         connected.value && 
         !!anchorWallet.value && 
         !loading.value && 
         !txLoading.value
})

// Create computed properties with getters/setters for v-model compatibility
const offerToken = computed({
  get: () => formStore.offerToken,
  set: (value) => formStore.setOfferToken(value)
})

const offerAmount = computed({
  get: () => formStore.offerAmount,
  set: (value) => formStore.setOfferAmount(value)
})

const requestToken = computed({
  get: () => formStore.requestToken,
  set: (value) => formStore.setRequestToken(value)
})

const requestAmount = computed({
  get: () => formStore.requestAmount,
  set: (value) => formStore.setRequestAmount(value)
})

// Individual settings computed properties for v-model compatibility
const settingsDirect = computed({
  get: () => formStore.settings.direct,
  set: (value) => formStore.updateSettings({ direct: value })
})

const settingsDirectAddress = computed({
  get: () => formStore.settings.directAddress,
  set: (value) => formStore.updateSettings({ directAddress: value })
})

const settingsWhitelist = computed({
  get: () => formStore.settings.whitelist,
  set: (value) => formStore.updateSettings({ whitelist: value })
})

const settingsWhitelistAddresses = computed({
  get: () => formStore.settings.whitelistAddresses,
  set: (value) => formStore.updateSettings({ whitelistAddresses: value })
})

const settingsExpire = computed({
  get: () => formStore.settings.expire,
  set: (value) => formStore.updateSettings({ expire: value })
})

const settingsExpireDate = computed({
  get: () => formStore.settings.expireDate,
  set: (value) => formStore.updateSettings({ expireDate: value })
})

const settingsPartialFill = computed({
  get: () => formStore.settings.partialFill,
  set: (value) => formStore.updateSettings({ partialFill: value })
})

const settingsSlippage = computed({
  get: () => formStore.settings.slippage,
  set: (value) => formStore.updateSettings({ slippage: value })
})

// Transaction costs composable
const { costBreakdown, loadingCosts, calculateCosts } = useTransactionCosts({
  costCalculator: calculateEscrowCreationCosts,
  getParams: () => {
    if (!connected.value || !publicKey.value || !formStore.offerToken || !formStore.requestToken) {
      return null
    }
    
    // Get shop fee configuration from selected collection
    let shopFee = null
    if (selectedCollection.value && selectedCollection.value.shopFee) {
      shopFee = selectedCollection.value.shopFee
    }
    
    // Calculate trade value for percentage fees (optional, can be 0 if not available)
    const tradeValue = 0 // TODO: Calculate from token prices if available
    
    return {
      maker: publicKey.value,
      depositTokenMint: formStore.offerToken.mint,
      requestTokenMint: formStore.requestToken.mint,
      depositAmount: formStore.offerAmount,
      shopFee,
      tradeValue
    }
  }
})

// Watch for token changes and collection changes to update costs (debounced)
watch([() => formStore.offerToken, () => formStore.requestToken, () => formStore.offerAmount, () => selectedCollection.value, connected, publicKey], () => {
  calculateCosts()
}, { immediate: true })

/**
 * Handle escrow creation
 */
const handleCreateEscrow = async () => {
  // Validate form
  if (!escrowStore.validateForm()) {
    return
  }

  // Validate wallet is ready
  try {
    validateWalletReady('create escrow')
  } catch (err) {
    escrowStore.setError('form', { general: err.message })
    loading.value = false
    return
  }

  loading.value = true
  escrowStore.clearErrors()

  try {
    // VALIDATION: Ensure recipient and onlyRecipient are consistent
    // If recipient is SystemProgram or null, onlyRecipient must be false
    // The program sets onlyRecipient based on whether recipient is provided and not SystemProgram
    let recipientAddress = null
    if (formStore.settings.direct && formStore.settings.directAddress) {
      const validation = validateRecipientAddress(formStore.settings.directAddress)
      
      if (!validation.valid) {
        escrowStore.setError('form', { 
          general: validation.error || 'Invalid recipient address',
          directAddress: validation.error
        })
        loading.value = false
        return
      }
      
      recipientAddress = validation.pubkey.toString()
    }
    
    // Convert amounts to smallest units
    const depositAmount = toSmallestUnits(
      formStore.offerAmount,
      formStore.offerToken.decimals
    )
    
    const requestAmount = toSmallestUnits(
      formStore.requestAmount,
      formStore.requestToken.decimals
    )

    // Generate seed using crypto random values (matching developer's implementation)
    // Create anchor.BN from random bytes
    const randomBytes = window.crypto.getRandomValues(new Uint8Array(8))
    const seed = toBN(randomBytes)

    // Calculate expiration timestamp (Unix timestamp in seconds, i64)
    let expireTimestamp = 0
    if (formStore.settings.expire && formStore.settings.expireDate) {
      expireTimestamp = Math.floor(new Date(formStore.settings.expireDate).getTime() / 1000)
    }
    
    // Convert slippage from milli-percent to decimal (1 = 0.001%)
    const slippage = formStore.settings.slippage / SLIPPAGE_DIVISOR

    // Get shop fee configuration from selected collection
    let shopFee = null
    if (selectedCollection.value && selectedCollection.value.shopFee) {
      shopFee = selectedCollection.value.shopFee
    }
    
    // Calculate trade value for percentage fees (optional, can be 0 if not available)
    const tradeValue = 0 // TODO: Calculate from token prices if available

    const params = {
      depositTokenMint: formStore.offerToken.mint,
      requestTokenMint: formStore.requestToken.mint,
      depositAmount,
      requestAmount,
      seed,
      expireTimestamp,
      allowPartialFill: formStore.settings.partialFill,
      onlyWhitelist: formStore.settings.whitelist,
      slippage,
      contractFeeAccount: CONTRACT_FEE_ACCOUNT,
      shopFee, // Pass shop fee configuration
      tradeValue,
      connection,
      wallet: anchorWallet.value
    }

    // Add recipient only if it's a valid address (not SystemProgram)
    // When recipient is null/undefined, the program will set it to SystemProgram and onlyRecipient=false
    // When recipient is a valid address, the program will set onlyRecipient=true
    if (recipientAddress) {
      params.recipient = recipientAddress
    }
    // If recipientAddress is null, we don't set params.recipient at all (it will be null/undefined)


    // Initialize escrow
    const signature = await initializeEscrow(params)

    // Derive escrow address to navigate to details page
    const makerPubkey = publicKey.value
    const seedBN = toBN(seed)
    const programId = toPublicKey(ESCROW_PROGRAM_ID)
    const { escrow: escrowPubkey } = deriveEscrowAccounts(makerPubkey, seedBN, programId)
    
    // Reset form on success
    formStore.resetForm()

    // Navigate to escrow details page with share query parameter to auto-open share modal
    router.push({
      path: `/escrow/${escrowPubkey.toString()}`,
      query: { share: 'true' }
    })
  } catch (err) {
    logError('Failed to create escrow:', err)
    const errorMessage = formatUserFriendlyError(err, 'create escrow') || txError.value || 'Failed to create escrow. Please try again.'
    escrowStore.setError('transaction', errorMessage)
  } finally {
    loading.value = false
  }
}
</script>
