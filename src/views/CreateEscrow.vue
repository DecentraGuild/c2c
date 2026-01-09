<template>
  <div class="min-h-screen bg-primary-bg py-3 sm:py-4 px-3 sm:px-4">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-3 sm:mb-4">
        <h1 class="text-xl sm:text-2xl font-bold text-text-primary mb-1">CREATE ESCROW</h1>
        <p class="text-xs sm:text-sm text-text-secondary">Secure SPL token escrow for Solana</p>
      </div>

      <!-- Main Card -->
      <div class="card space-y-3">
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
        <div v-if="displayError" class="p-3 bg-status-error/10 border border-status-error/20 rounded-lg text-sm text-status-error">
          {{ displayError }}
        </div>

        <!-- Action Button -->
        <div class="pt-2">
          <button 
            @click="handleCreateEscrow"
            :disabled="!canSubmit || loading"
            class="btn-primary w-full py-3 sm:py-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
          >
            <span v-if="loading">Creating Escrow...</span>
            <span v-else>Create Escrow</span>
          </button>
        </div>

        <!-- Transaction Cost Breakdown -->
        <div class="pt-2 border-t border-border-color">
          <div v-if="costBreakdown" class="space-y-1.5">
            <div class="text-xs text-text-muted mb-1.5">Transaction Costs</div>
            <div class="space-y-1">
              <div
                v-for="item in costBreakdown.items"
                :key="item.label"
                class="flex items-center justify-between text-xs"
              >
                <span class="text-text-secondary">{{ item.label }}</span>
                <span class="text-text-primary font-medium">{{ formatDecimals(item.amount) }} SOL</span>
              </div>
            </div>
            <div class="pt-1.5 border-t border-border-color/50 flex items-center justify-between">
              <span class="text-text-primary font-semibold">Total</span>
              <span class="text-text-primary font-bold">{{ formatDecimals(costBreakdown.total) }} SOL</span>
            </div>
            <div class="text-xs pt-1">
              <span class="text-status-success">{{ formatDecimals(costBreakdown.recoverable) }} SOL recoverable</span>
              <span class="mx-1 text-text-secondary">•</span>
              <span class="text-text-secondary">{{ formatDecimals(costBreakdown.nonRecoverable) }} SOL fee</span>
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
import { useEscrowTransactions } from '../composables/useEscrowTransactions'
import { useSolanaConnection } from '../composables/useSolanaConnection'
import { useErrorDisplay } from '../composables/useErrorDisplay'
import { toSmallestUnits, formatDecimals } from '../utils/formatters'
import { useDebounce, DEBOUNCE_DELAYS } from '../composables/useDebounce'
import { CONTRACT_FEE_ACCOUNT } from '../utils/constants'
import { ESCROW_PROGRAM_ID } from '../utils/constants/escrow'
import { calculateEscrowCreationCosts } from '../utils/transactionCosts'
import { useTransactionCosts } from '../composables/useTransactionCosts'
import { deriveEscrowAccounts } from '../utils/escrowTransactions'
import { validateRecipientAddress } from '../utils/recipientValidation'
import { toBN, toPublicKey } from '../utils/solanaUtils'
import { useWalletValidation } from '../composables/useWalletValidation'
import { formatUserFriendlyError } from '../utils/errorMessages'

const router = useRouter()
const escrowStore = useEscrowStore()
const walletAdapter = useWallet()
const anchorWallet = useAnchorWallet() // Get Anchor-compatible wallet
const { publicKey, connected } = walletAdapter
const connection = useSolanaConnection()
const { initializeEscrow, loading: txLoading, error: txError } = useEscrowTransactions()
const { validateWallet: validateWalletReady } = useWalletValidation()
const { displayError } = useErrorDisplay({ txError, errorTypes: ['transaction', 'form'] })

const loading = ref(false)
const showPricing = ref(false)

const canSubmit = computed(() => {
  // Ensure Anchor wallet is available for transaction building
  return escrowStore.isFormValid && 
         connected.value && 
         !!anchorWallet.value && 
         !loading.value && 
         !txLoading.value
})

// Create computed properties with getters/setters for v-model compatibility
const offerToken = computed({
  get: () => escrowStore.offerToken,
  set: (value) => escrowStore.setOfferToken(value)
})

const offerAmount = computed({
  get: () => escrowStore.offerAmount,
  set: (value) => escrowStore.setOfferAmount(value)
})

const requestToken = computed({
  get: () => escrowStore.requestToken,
  set: (value) => escrowStore.setRequestToken(value)
})

const requestAmount = computed({
  get: () => escrowStore.requestAmount,
  set: (value) => escrowStore.setRequestAmount(value)
})

// Individual settings computed properties for v-model compatibility
const settingsDirect = computed({
  get: () => escrowStore.settings.direct,
  set: (value) => escrowStore.updateSettings({ direct: value })
})

const settingsDirectAddress = computed({
  get: () => escrowStore.settings.directAddress,
  set: (value) => escrowStore.updateSettings({ directAddress: value })
})

const settingsWhitelist = computed({
  get: () => escrowStore.settings.whitelist,
  set: (value) => escrowStore.updateSettings({ whitelist: value })
})

const settingsWhitelistAddresses = computed({
  get: () => escrowStore.settings.whitelistAddresses,
  set: (value) => escrowStore.updateSettings({ whitelistAddresses: value })
})

const settingsExpire = computed({
  get: () => escrowStore.settings.expire,
  set: (value) => escrowStore.updateSettings({ expire: value })
})

const settingsExpireDate = computed({
  get: () => escrowStore.settings.expireDate,
  set: (value) => escrowStore.updateSettings({ expireDate: value })
})

const settingsPartialFill = computed({
  get: () => escrowStore.settings.partialFill,
  set: (value) => escrowStore.updateSettings({ partialFill: value })
})

const settingsSlippage = computed({
  get: () => escrowStore.settings.slippage,
  set: (value) => escrowStore.updateSettings({ slippage: value })
})

// Transaction costs composable
const { costBreakdown, loadingCosts, calculateCosts } = useTransactionCosts({
  costCalculator: calculateEscrowCreationCosts,
  getParams: () => {
    if (!connected.value || !publicKey.value || !escrowStore.offerToken || !escrowStore.requestToken) {
      return null
    }
    return {
      maker: publicKey.value,
      depositTokenMint: escrowStore.offerToken.mint,
      requestTokenMint: escrowStore.requestToken.mint
    }
  }
})

// Watch for token changes to update costs (debounced)
watch([() => escrowStore.offerToken, () => escrowStore.requestToken, connected, publicKey], () => {
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
    if (escrowStore.settings.direct && escrowStore.settings.directAddress) {
      const validation = validateRecipientAddress(escrowStore.settings.directAddress)
      
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
      escrowStore.offerAmount,
      escrowStore.offerToken.decimals
    )
    
    const requestAmount = toSmallestUnits(
      escrowStore.requestAmount,
      escrowStore.requestToken.decimals
    )

    // Generate seed using crypto random values (matching developer's implementation)
    // Create anchor.BN from random bytes
    const randomBytes = window.crypto.getRandomValues(new Uint8Array(8))
    const seed = toBN(randomBytes)

    // Calculate expiration timestamp (Unix timestamp in seconds, i64)
    let expireTimestamp = 0
    if (escrowStore.settings.expire && escrowStore.settings.expireDate) {
      expireTimestamp = Math.floor(new Date(escrowStore.settings.expireDate).getTime() / 1000)
    }

    // Convert slippage from milli-percent to decimal (1 = 0.001%)
    const slippage = escrowStore.settings.slippage / 100000

    const params = {
      depositTokenMint: escrowStore.offerToken.mint,
      requestTokenMint: escrowStore.requestToken.mint,
      depositAmount,
      requestAmount,
      seed,
      expireTimestamp,
      allowPartialFill: escrowStore.settings.partialFill,
      onlyWhitelist: escrowStore.settings.whitelist,
      slippage,
      contractFeeAccount: CONTRACT_FEE_ACCOUNT,
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

    console.log('Creating escrow with params:', {
      recipient: params.recipient || 'null (public escrow)',
      direct: escrowStore.settings.direct,
      directAddress: escrowStore.settings.directAddress
    })

    // Initialize escrow
    const signature = await initializeEscrow(params)

    // Derive escrow address to navigate to details page
    const makerPubkey = publicKey.value
    const seedBN = toBN(seed)
    const programId = toPublicKey(ESCROW_PROGRAM_ID)
    const { escrow: escrowPubkey } = deriveEscrowAccounts(makerPubkey, seedBN, programId)
    
    // Reset form on success
    escrowStore.resetForm()

    // Navigate to escrow details page with share query parameter to auto-open share modal
    router.push({
      path: `/escrow/${escrowPubkey.toString()}`,
      query: { share: 'true' }
    })
  } catch (err) {
    console.error('Failed to create escrow:', err)
    const errorMessage = formatUserFriendlyError(err, 'create escrow') || txError.value || 'Failed to create escrow. Please try again.'
    escrowStore.setError('transaction', errorMessage)
  } finally {
    loading.value = false
  }
}
</script>
