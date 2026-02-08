<template>
  <div class="min-h-screen bg-primary-bg py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="mb-4">
        <h1 class="text-base sm:text-lg font-bold text-text-primary mb-1">Manage Escrows</h1>
        <p class="text-xs text-text-secondary">View and manage your escrow transactions</p>
      </div>

      <!-- Error Message -->
      <div v-if="displayError" class="mb-3 p-2.5 bg-status-error/10 border border-status-error/20 rounded-lg text-xs sm:text-sm text-status-error">
        {{ displayError }}
      </div>

      <!-- Loading State -->
      <div v-if="loadingEscrows || loadingStorefronts" class="card">
        <BaseLoading :message="loadingEscrows ? 'Loading escrows...' : 'Loading storefronts...'" />
      </div>

      <!-- Empty State -->
      <div v-else-if="escrowGroups.length === 0" class="card">
        <div class="text-center py-12">
          <Icon icon="mdi:inbox-outline" class="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
          <p class="text-text-secondary">No active escrows</p>
          <p class="text-sm text-text-muted mt-2">Create your first escrow to get started</p>
        </div>
      </div>

      <!-- Grouped Escrows -->
      <div v-else class="space-y-4">
        <div v-for="group in orderedEscrowGroups" :key="group.id" class="card">
          <!-- Group Header -->
          <div class="flex items-center gap-2.5 mb-3 pb-3 border-b border-border-color/50">
            <div v-if="group.storefront && group.storefront.logo" class="flex-shrink-0">
              <img 
                :src="group.storefront.logo" 
                :alt="group.storefront.name"
                class="w-8 h-8 object-contain"
              />
            </div>
            <div v-else class="flex-shrink-0">
              <Icon icon="mdi:swap-horizontal" class="w-8 h-8 text-text-muted" />
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-base font-semibold text-text-primary">{{ group.label }}</h2>
              <p class="text-xs text-text-muted">
                {{ group.escrows.length }} {{ group.escrows.length === 1 ? 'order' : 'orders' }}
              </p>
            </div>
          </div>

          <!-- Escrows in Group -->
          <div class="space-y-3">
            <EscrowCard
              v-for="escrow in group.escrows"
              :key="escrow.id"
              :escrow="escrow"
              :loading="cancellingEscrow === escrow.id"
              @share="showShareModal"
              @cancel="cancelEscrow"
              @claim="claimEscrow"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmModal
      v-model:show="showConfirm"
      :title="confirmTitle"
      :message="confirmMessage"
      :loading="confirmLoading || cancellingEscrow !== null"
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
import { Icon } from '@iconify/vue'
import { BN } from '@coral-xyz/anchor'
import BaseLoading from '@/components/BaseLoading.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import BaseShareModal from '@/components/BaseShareModal.vue'
import EscrowCard from '@/components/EscrowCard.vue'
import { useEscrowStore } from '@/stores/escrow'
import { useStorefrontStore } from '@/stores/storefront'
import { useStorefrontMetadataStore } from '@/stores/storefrontMetadata'
import { useEscrowTransactions } from '@/composables/useEscrowTransactions'
import { useErrorDisplay } from '@/composables/useErrorDisplay'
import { useWalletContext } from '@/composables/useWalletContext'
import { useConfirmationModal } from '@/composables/useConfirmationModal'
import { useShareModal } from '@/composables/useShareModal'
import { useToast } from '@/composables/useToast'
import { formatUserFriendlyError } from '@/utils/errorMessages'
import { logError } from '@/utils/logger'
import { groupEscrowsByStorefront } from '@/utils/marketplaceHelpers'
import { getEscrowPath } from '@/utils/constants'

const escrowStore = useEscrowStore()
const storefrontStore = useStorefrontStore()
const storefrontMetadataStore = useStorefrontMetadataStore()
const { cancelEscrow: cancelEscrowTx, loading: txLoading, error: txError } = useEscrowTransactions()
const { validateWallet: validateWalletReady, publicKey, connected } = useWalletContext()
const { displayError } = useErrorDisplay({ txError, errorTypes: ['transaction', 'escrows'] })
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
const cancellingEscrow = ref(null)

// Use store computed properties
const activeEscrows = computed(() => {
  if (!connected.value || !publicKey.value) return []
  return escrowStore.activeEscrows.filter(e => e.maker === publicKey.value.toString())
})
const loadingEscrows = computed(() => escrowStore.loadingEscrows)
const loadingStorefronts = computed(() => storefrontStore.loadingStorefronts)
const storefronts = computed(() => storefrontStore.storefronts)
const selectedStorefrontId = computed(() => storefrontStore.selectedStorefrontId)

// Group escrows by storefront (use metadata cache so individual NFT trades group under storefront)
const escrowGroups = computed(() => {
  if (activeEscrows.value.length === 0) return []
  return groupEscrowsByStorefront(activeEscrows.value, storefronts.value, storefrontMetadataStore)
})

// Active storefront group first, then others; P2P last
const orderedEscrowGroups = computed(() => {
  const groups = escrowGroups.value
  const activeId = selectedStorefrontId.value
  if (!activeId || groups.length <= 1) return groups
  return [...groups].sort((a, b) => {
    if (a.id === activeId) return -1
    if (b.id === activeId) return 1
    if (a.id === 'p2p') return 1
    if (b.id === 'p2p') return -1
    return 0
  })
})

onMounted(async () => {
  if (storefronts.value.length === 0) {
    await storefrontStore.loadStorefronts()
  }
  if (connected.value && publicKey.value) {
    escrowStore.loadEscrows(publicKey.value)
  }
})

watch([connected, publicKey], ([newConnected, newPublicKey]) => {
  if (newConnected && newPublicKey) {
    escrowStore.loadEscrows(newPublicKey)
  }
})

/**
 * Show share modal for escrow
 */
const showShareModal = (escrow) => {
  openShareModal(`${window.location.origin}${getEscrowPath(escrow.id)}`)
}

/**
 * Show cancel confirmation modal
 */
const showCancelConfirm = (escrow) => {
  try {
    validateWalletReady('cancel escrow')
  } catch (err) {
    warning(err.message)
    return
  }

  if (escrow.maker !== publicKey.value.toString()) {
    warning('You can only cancel your own escrows')
    return
  }

  showConfirmModal(
    'Cancel Escrow',
    'Are you sure you want to cancel this escrow? This action cannot be undone. This will claim back the deposit and token accounts.',
    () => executeCancel(escrow)
  )
}

/**
 * Show claim confirmation modal
 */
const showClaimConfirm = (escrow) => {
  try {
    validateWalletReady('complete escrow')
  } catch (err) {
    warning(err.message)
    return
  }

  if (escrow.maker !== publicKey.value.toString()) {
    warning('You can only complete your own escrows')
    return
  }

  showConfirmModal(
    'Complete Escrow',
    'This will close the escrow account and recover the account rent (SOL). Tokens have already been received automatically when the escrow was filled.',
    () => executeCancel(escrow)
  )
}

/**
 * Execute cancel/claim transaction
 */
const executeCancel = async (escrow) => {
  cancellingEscrow.value = escrow.id
  escrowStore.clearErrors()

  try {
    const seedBN = new BN(escrow.seed)
    
    await cancelEscrowTx({
      depositTokenMint: escrow.depositToken.mint,
      requestTokenMint: escrow.requestToken.mint,
      seed: seedBN
    })

    // Reload escrows
    await escrowStore.loadEscrows(publicKey.value)
    success('Escrow cancelled successfully!')
  } catch (error) {
    logError('Failed to cancel escrow:', error)
    const errorMessage = formatUserFriendlyError(error, 'cancel escrow') || 'Failed to cancel escrow. Please try again.'
    showError(errorMessage)
  } finally {
    cancellingEscrow.value = null
  }
}

/**
 * Handle cancel escrow action
 */
const cancelEscrow = (escrow) => {
  showCancelConfirm(escrow)
}

/**
 * Handle claim escrow action (uses same cancel transaction)
 */
const claimEscrow = (escrow) => {
  showClaimConfirm(escrow)
}
</script>
