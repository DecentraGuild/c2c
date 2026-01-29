<template>
  <div
    class="card hover:border-primary-color/50 transition-all duration-200 hover:shadow-lg group"
  >
    <div class="flex flex-col h-full">
      <!-- Badge at Top of Card - Full Width, Centered -->
      <div class="mb-3 flex justify-center">
        <CollectionBadge
          :verification-status="collection.verification_status || (collection.verified ? 'verified' : 'community')"
          size="md"
        />
      </div>

      <!-- Collection Image -->
      <router-link
        :to="`/marketplace?collection=${collection.id}`"
        class="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-secondary-bg flex items-center justify-center cursor-pointer"
      >
        <img
          v-if="collection.logo"
          :src="collection.logo"
          :alt="collection.name"
          class="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-200"
          @error="handleImageError"
        />
        <Icon
          v-else
          icon="mdi:image-off"
          class="w-16 h-16 text-text-muted/30"
        />
      </router-link>

      <!-- Collection Info -->
      <div class="flex-1 flex flex-col min-h-0">
        <router-link
          :to="`/marketplace?collection=${collection.id}`"
          class="cursor-pointer flex-shrink-0"
        >
          <h3 class="text-lg sm:text-xl font-bold text-text-primary group-hover:text-primary-color transition-colors mb-2">
            {{ collection.name }}
          </h3>
          
          <p v-if="collection.description" class="text-sm text-text-secondary mb-4 line-clamp-2">
            {{ collection.description }}
          </p>
        </router-link>

        <!-- Stats - Fixed to Bottom -->
        <div class="pt-4 border-t border-border-color mt-auto">
          <div class="flex items-start justify-between gap-4 mb-3">
            <!-- Open Trades - Always Visible -->
            <div class="flex items-center gap-2 text-sm text-text-secondary flex-shrink-0">
              <Icon icon="mdi:swap-horizontal" class="w-4 h-4" />
              <span class="font-semibold">{{ openTrades }}</span>
              <span>{{ openTrades === 1 ? 'trade' : 'trades' }}</span>
            </div>
            
            <!-- Expand/Collapse Button -->
            <button
              @click.stop="expanded = !expanded"
              class="flex items-center gap-1 text-xs text-text-secondary hover:text-primary-color transition-colors flex-shrink-0"
            >
              <span>{{ expanded ? 'Less' : 'Details' }}</span>
              <Icon
                :icon="expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                class="w-4 h-4"
              />
            </button>
          </div>

          <!-- Expandable Details -->
          <div
            v-if="expanded"
            class="space-y-4 pt-3 border-t border-border-color text-xs"
          >
            <!-- Accepted Currencies Section - First -->
            <div v-if="acceptedCurrencies.length > 0">
              <div class="flex items-center gap-2 mb-2 text-text-primary font-semibold">
                <Icon icon="mdi:wallet" class="w-4 h-4" />
                <span>Accepted Currencies</span>
              </div>
              <div class="pl-6 space-y-1.5">
                <div
                  v-for="currency in acceptedCurrencies"
                  :key="currency.mint"
                  class="flex items-center justify-between gap-2"
                >
                  <span class="text-text-secondary">
                    {{ currency.symbol || currency.name || 'Unknown' }}
                  </span>
                  <BaseAddressDisplay
                    :address="currency.mint"
                    :truncate="true"
                    :show-explorer="false"
                    :compact="true"
                    text-class="text-text-muted text-xs"
                    copy-title="Copy mint address"
                  />
                </div>
              </div>
            </div>

            <!-- Fees Section - Second -->
            <div>
              <div class="flex items-center gap-2 mb-2 text-text-primary font-semibold">
                <Icon icon="mdi:currency-usd" class="w-4 h-4" />
                <span>Fees</span>
              </div>
              <div class="space-y-1.5 pl-6">
                <div class="flex items-center justify-between">
                  <span class="text-text-secondary">Maker:</span>
                  <span class="font-semibold text-primary-color">{{ getMakerFee() }} SOL</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-text-secondary">Taker:</span>
                  <span class="font-semibold text-primary-color">{{ getTakerFee() }} SOL</span>
                </div>
                <div v-if="maxRoyalty > 0" class="flex items-center justify-between">
                  <span class="text-text-secondary">Max Royalty:</span>
                  <span class="font-semibold text-primary-color">{{ maxRoyalty.toFixed(2) }}%</span>
                </div>
                <div v-if="collection.shopFee?.wallet" class="flex items-center justify-between">
                  <span class="text-text-secondary">Shop Fee:</span>
                  <span class="font-semibold text-primary-color">
                    {{ getShopFeeDisplay() }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Fee Wallet Section - Third -->
            <div v-if="collection.shopFee?.wallet">
              <div class="flex items-center gap-2 mb-2 text-text-primary font-semibold">
                <Icon icon="mdi:wallet-outline" class="w-4 h-4" />
                <span>Fee Wallet</span>
              </div>
              <div class="pl-6">
                <BaseAddressDisplay
                  :address="collection.shopFee.wallet"
                  :truncate="true"
                  text-class="text-text-secondary text-xs"
                  copy-title="Copy fee wallet address"
                />
              </div>
            </div>

            <!-- Collection Mints Section - Last -->
            <div v-if="collectionMintsList.length > 0">
              <div class="flex items-center gap-2 mb-2 text-text-primary font-semibold">
                <Icon icon="mdi:format-list-bulleted" class="w-4 h-4" />
                <span>Collection Items ({{ collectionMintsList.length }})</span>
              </div>
              <div class="pl-6 space-y-1.5 max-h-48 overflow-y-auto collection-scroll-container">
                <div class="collection-scroll-content">
                  <template v-for="(item, index) in collectionMintsList" :key="item.mint || index">
                    <!-- Category Header (show when category changes) -->
                    <div
                      v-if="item.category && (index === 0 || collectionMintsList[index - 1].category !== item.category)"
                      class="text-text-primary font-semibold text-xs capitalize"
                    >
                      {{ item.category }}
                    </div>
                    <div class="flex items-center justify-between gap-2" :class="{ 'pl-4': item.category }">
                      <span class="text-text-secondary truncate flex-1">
                        {{ item.name || truncateAddress(item.mint, 4, 4) }}
                      </span>
                      <BaseAddressDisplay
                        :address="item.mint"
                        :truncate="true"
                        :show-explorer="false"
                        :compact="true"
                        text-class="text-text-muted text-xs"
                        copy-title="Copy mint address"
                      />
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import CollectionBadge from './CollectionBadge.vue'
import BaseAddressDisplay from './BaseAddressDisplay.vue'
import { useCollectionDisplay } from '../composables/useCollectionDisplay'
import { truncateAddress } from '../utils/formatters'

const props = defineProps({
  collection: {
    type: Object,
    required: true
  },
  openTrades: {
    type: Number,
    default: 0
  }
})

const imageError = ref(false)
const expanded = ref(false)

// Use collection display composable
const {
  getMakerFee,
  getTakerFee,
  getShopFeeDisplay,
  collectionMintsList,
  maxRoyalty,
  acceptedCurrencies,
  formatRoyaltyFee
} = useCollectionDisplay(computed(() => props.collection))

const handleImageError = () => {
  imageError.value = true
}
</script>
