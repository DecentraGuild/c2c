<template>
  <div class="min-h-screen bg-primary-bg py-3 sm:py-4 px-3 sm:px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-3 sm:mb-4">
        <h1 class="text-xl sm:text-2xl font-bold text-text-primary mb-1">Manage Escrows</h1>
        <p class="text-xs sm:text-sm text-text-secondary">View and manage your escrow transactions</p>
      </div>

      <!-- Error Message -->
      <div v-if="escrowErrors" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
        {{ escrowErrors }}
      </div>

      <!-- Escrows List -->
      <div class="card">
        <BaseLoading v-if="loadingEscrows" message="Loading escrows..." />
        <div v-else-if="activeEscrows.length === 0" class="text-center py-12">
          <Icon icon="mdi:inbox-outline" class="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
          <p class="text-text-secondary">No active escrows</p>
          <p class="text-sm text-text-muted mt-2">Create your first escrow to get started</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="escrow in activeEscrows"
            :key="escrow.id"
            class="bg-secondary-bg/50 rounded-xl p-4 border border-border-color hover:border-primary-color/40 transition-all"
          >
            <!-- Header Row -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-0 sm:justify-between mb-4">
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs font-semibold',
                      escrow.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      escrow.status === 'filled' ? 'bg-blue-500/20 text-blue-400' :
                      escrow.status === 'expired' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    ]"
                  >
                    {{ escrow.status.toUpperCase() }}
                  </span>
                  <span v-if="escrow.allowPartialFill" class="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                    Partial Fill
                  </span>
                  <span v-if="escrow.onlyWhitelist" class="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                    Whitelist Only
                  </span>
                </div>
                
                <!-- Trade Details -->
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="text-text-muted text-sm">Offering:</span>
                    <TokenAmountDisplay
                      :token="escrow.depositToken"
                      :amount="escrow.depositRemaining"
                      :decimals="escrow.depositToken.decimals"
                      icon-size="sm"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-text-muted text-sm">Requesting:</span>
                    <TokenAmountDisplay
                      :token="escrow.requestToken"
                      :amount="escrow.requestAmount"
                      :decimals="escrow.requestToken.decimals"
                      icon-size="sm"
                    />
                  </div>
                  <div v-if="escrow.expireTimestamp > 0" class="flex items-center gap-2">
                    <Icon icon="mdi:clock-outline" class="w-4 h-4 text-text-muted" />
                    <span class="text-text-muted text-xs">
                      Expires: {{ formatTimestamp(escrow.expireTimestamp * 1000) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-4">
                <div class="flex gap-2">
                  <button
                    @click="showShareModal(escrow)"
                    class="btn-secondary text-sm py-2.5 sm:py-2 px-3 sm:px-4 inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial min-h-[44px]"
                    title="Share escrow"
                  >
                    <Icon icon="mdi:share-variant" class="w-4 h-4" />
                    <span class="hidden sm:inline">Share</span>
                  </button>
                  <router-link
                    :to="`/escrow/${escrow.id}`"
                    class="btn-secondary text-sm py-2.5 sm:py-2 px-3 sm:px-4 inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial min-h-[44px]"
                    title="View details"
                  >
                    <Icon icon="mdi:eye" class="w-4 h-4" />
                    <span class="hidden sm:inline">Details</span>
                  </router-link>
                </div>
                <button
                  v-if="escrow.status === 'filled'"
                  @click="claimEscrow(escrow)"
                  :disabled="cancellingEscrow === escrow.id"
                  class="btn-primary text-sm py-2.5 sm:py-2 px-3 sm:px-4 inline-flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
                  title="Complete escrow and recover rent"
                >
                  <Icon v-if="cancellingEscrow === escrow.id" icon="svg-spinners:ring-resize" class="w-4 h-4" />
                  <Icon v-else icon="mdi:check-circle" class="w-4 h-4" />
                  Complete
                </button>
                <button
                  v-else-if="escrow.status === 'active'"
                  @click="cancelEscrow(escrow)"
                  :disabled="cancellingEscrow === escrow.id"
                  class="btn-secondary text-sm py-2.5 sm:py-2 px-3 sm:px-4 inline-flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
                  title="Cancel escrow"
                >
                  <Icon v-if="cancellingEscrow === escrow.id" icon="svg-spinners:ring-resize" class="w-4 h-4" />
                  <Icon v-else icon="mdi:close-circle" class="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>

            <!-- Escrow Details Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-border-color/50">
              <div class="flex items-center gap-2">
                <span class="text-text-muted">Escrow ID:</span>
                <BaseAddressDisplay 
                  :address="escrow.id" 
                  text-class="text-text-secondary text-xs"
                  :start-chars="4"
                  :end-chars="4"
                />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-text-muted">Recipient:</span>
                <span v-if="!escrow.recipient" class="text-text-secondary">Any</span>
                <BaseAddressDisplay 
                  v-else
                  :address="escrow.recipient" 
                  text-class="text-text-secondary text-xs"
                  :start-chars="4"
                  :end-chars="4"
                />
              </div>
            </div>
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
import BaseLoading from '../components/BaseLoading.vue'
import { useEscrowStore } from '../stores/escrow'
import { useWallet, useAnchorWallet } from 'solana-wallets-vue'
import { useEscrowTransactions } from '../composables/useEscrowTransactions'
import { useSolanaConnection } from '../composables/useSolanaConnection'
import { formatBalance, truncateAddress, formatTimestamp } from '../utils/formatters'
import { BN } from '@coral-xyz/anchor'
import ConfirmModal from '../components/ConfirmModal.vue'
import BaseShareModal from '../components/BaseShareModal.vue'
import BaseAddressDisplay from '../components/BaseAddressDisplay.vue'
import TokenAmountDisplay from '../components/TokenAmountDisplay.vue'
import { useExplorer } from '../composables/useExplorer'
import { useToast } from '../composables/useToast'
import { useConfirmationModal } from '../composables/useConfirmationModal'
import { useShareModal } from '../composables/useShareModal'

const escrowStore = useEscrowStore()
const walletAdapter = useWallet()
const anchorWallet = useAnchorWallet()
const { publicKey, connected } = walletAdapter
const connection = useSolanaConnection()
const { cancelEscrow: cancelEscrowTx, loading: txLoading } = useEscrowTransactions()
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
const selectedEscrow = ref(null)
const cancellingEscrow = ref(null)

// Use store computed properties
const activeEscrows = computed(() => {
  if (!connected.value || !publicKey.value) return []
  return escrowStore.activeEscrows.filter(e => e.maker === publicKey.value.toString())
})
const loadingEscrows = escrowStore.loadingEscrows
const escrowErrors = computed(() => escrowStore.errors.escrows)

// Load escrows when component mounts or wallet connects
onMounted(() => {
  if (connected.value && publicKey.value) {
    escrowStore.loadEscrows(publicKey.value)
  }
})

watch([connected, publicKey], ([newConnected, newPublicKey]) => {
  if (newConnected && newPublicKey) {
    escrowStore.loadEscrows(newPublicKey)
  }
})

const showShareModal = (escrow) => {
  selectedEscrow.value = escrow
  openShareModal(`${window.location.origin}/escrow/${escrow.id}`)
}

const showCancelConfirm = (escrow) => {
  if (!connected.value || !publicKey.value || !anchorWallet.value) {
    warning('Please connect your wallet first')
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

const showClaimConfirm = (escrow) => {
  if (!connected.value || !publicKey.value || !anchorWallet.value) {
    warning('Please connect your wallet first')
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

const executeCancel = async (escrow) => {
  cancellingEscrow.value = escrow.id

  try {
    const seedBN = new BN(escrow.seed)
    
    // The composable already provides maker, connection, and wallet
    await cancelEscrowTx({
      depositTokenMint: escrow.depositToken.mint,
      requestTokenMint: escrow.requestToken.mint,
      seed: seedBN
    })

    // Reload escrows
    await escrowStore.loadEscrows(publicKey.value)
    success('Escrow cancelled successfully!')
  } catch (error) {
    console.error('Failed to cancel escrow:', error)
    showError(error.message || 'Failed to cancel escrow')
  } finally {
    cancellingEscrow.value = null
  }
}

const cancelEscrow = (escrow) => {
  showCancelConfirm(escrow)
}

const claimEscrow = (escrow) => {
  // Claim uses the same cancel transaction (as mentioned by user)
  showClaimConfirm(escrow)
}
</script>
