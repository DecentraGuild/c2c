<template>
  <div class="min-h-screen bg-primary-bg py-3 sm:py-4 px-3 sm:px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-3 sm:mb-4">
        <h1 class="text-xl sm:text-2xl font-bold text-text-primary mb-1">Manage Escrows</h1>
        <p class="text-xs sm:text-sm text-text-secondary">View and manage your escrow transactions</p>
      </div>

      <!-- Error Message -->
      <div v-if="escrowErrors" class="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-lg text-sm text-status-error">
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
          <EscrowCard
            v-for="escrow in activeEscrows"
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
import { formatBalance, truncateAddress } from '../utils/formatters'
import { BN } from '@coral-xyz/anchor'
import ConfirmModal from '../components/ConfirmModal.vue'
import BaseShareModal from '../components/BaseShareModal.vue'
import EscrowCard from '../components/EscrowCard.vue'
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
