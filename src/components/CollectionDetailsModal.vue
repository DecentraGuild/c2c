<template>
  <BaseModal
    :show="show"
    :title="collection?.name || 'Marketplace details'"
    :max-width="'max-w-lg'"
    @update:show="$emit('update:show', $event)"
  >
    <div class="space-y-4 text-sm">
      <!-- Collection image -->
      <div class="flex justify-center">
        <div
          class="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-secondary-bg flex items-center justify-center flex-shrink-0"
        >
          <img
            v-if="collection?.logo && !imageError"
            :src="collection.logo"
            :alt="collection?.name"
            class="w-full h-full object-contain p-2"
            @error="imageError = true"
          />
          <Icon
            v-else
            icon="mdi:image-off"
            class="w-10 h-10 text-text-muted/30"
          />
        </div>
      </div>

      <p v-if="collection?.description" class="text-text-secondary">
        {{ collection.description }}
      </p>

      <!-- Open Trades -->
      <div class="flex items-center gap-2 text-text-secondary">
        <Icon icon="mdi:swap-horizontal" class="w-4 h-4" />
        <span class="font-semibold">{{ openTrades }}</span>
        <span>{{ openTrades === 1 ? 'trade' : 'trades' }} open</span>
      </div>

      <!-- Accepted Currencies -->
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

      <!-- Fees -->
      <div>
        <div class="flex items-center gap-2 mb-2 text-text-primary font-semibold">
          <Icon icon="mdi:currency-usd" class="w-4 h-4" />
          <span>Fees</span>
        </div>
        <div class="space-y-1.5 pl-6">
          <div class="flex items-center justify-between">
            <span class="text-text-secondary">Maker:</span>
            <span class="font-semibold text-primary-color">{{ makerFee() }} SOL</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-text-secondary">Taker:</span>
            <span class="font-semibold text-primary-color">{{ takerFee() }} SOL</span>
          </div>
          <div v-if="maxRoyalty > 0" class="flex items-center justify-between">
            <span class="text-text-secondary">Max Royalty:</span>
            <span class="font-semibold text-primary-color">{{ maxRoyalty.toFixed(2) }}%</span>
          </div>
          <div v-if="collection?.shopFee?.wallet" class="flex items-center justify-between">
            <span class="text-text-secondary">Shop Fee:</span>
            <span class="font-semibold text-primary-color">
              {{ shopFeeDisplay() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Fee Wallet -->
      <div v-if="collection?.shopFee?.wallet">
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

      <!-- Collection Mints -->
      <div v-if="collectionMintsList.length > 0">
        <div class="flex items-center gap-2 mb-2 text-text-primary font-semibold">
          <Icon icon="mdi:format-list-bulleted" class="w-4 h-4" />
          <span>Collection Items ({{ collectionMintsList.length }})</span>
        </div>
        <BaseScrollArea max-height="12rem" content-class="pl-6 space-y-1.5">
          <template v-for="(item, index) in collectionMintsList" :key="item.mint || index">
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
        </BaseScrollArea>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          class="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          @click="$emit('update:show', false)"
        >
          Close
        </button>
        <router-link
          :to="marketplaceRoute"
          class="px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-primary-color/90 transition-colors font-semibold flex items-center gap-2"
          @click="$emit('update:show', false)"
        >
          <Icon icon="mdi:arrow-right" class="w-4 h-4" />
          Enter
        </router-link>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import BaseModal from './BaseModal.vue'
import BaseScrollArea from './BaseScrollArea.vue'
import BaseAddressDisplay from './BaseAddressDisplay.vue'
import { useCollectionDisplay } from '../composables/useCollectionDisplay'
import { truncateAddress } from '../utils/formatters'

const imageError = ref(false)

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  collection: {
    type: Object,
    default: null
  },
  openTrades: {
    type: Number,
    default: 0
  }
})

defineEmits(['update:show'])

const {
  makerFee,
  takerFee,
  shopFeeDisplay,
  collectionMintsList,
  maxRoyalty,
  acceptedCurrencies
} = useCollectionDisplay(computed(() => props.collection))

const marketplaceRoute = computed(() => {
  if (!props.collection?.id) return '/marketplace'
  return { path: '/marketplace', query: { storefront: props.collection.id } }
})
</script>
