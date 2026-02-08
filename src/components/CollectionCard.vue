<template>
  <div
    class="card hover:border-primary-color/50 transition-all duration-200 hover:shadow-lg group max-w-sm mx-auto w-full"
  >
    <div class="flex flex-col h-full">
      <!-- Badge at Top of Card - Full Width, Centered -->
      <div class="mb-2 flex justify-center">
        <CollectionBadge
          :verification-status="storefront.verification_status || (storefront.verified ? 'verified' : 'community')"
          size="md"
        />
      </div>

      <!-- Storefront image -->
      <router-link
        :to="getMarketplaceRoute(storefront.id)"
        class="relative w-full aspect-square mb-2 rounded-lg overflow-hidden bg-secondary-bg flex items-center justify-center cursor-pointer"
      >
        <img
          v-if="storefront.logo"
          :src="storefront.logo"
          :alt="storefront.name"
          class="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
          @error="handleImageError"
        />
        <Icon
          v-else
          icon="mdi:image-off"
          class="w-10 h-10 text-text-muted/30"
        />
      </router-link>

      <!-- Storefront info -->
      <div class="flex-1 flex flex-col min-h-0">
        <router-link
          :to="getMarketplaceRoute(storefront.id)"
          class="cursor-pointer flex-shrink-0"
        >
          <h3 class="text-sm font-bold text-text-primary group-hover:text-primary-color transition-colors mb-1">
            {{ storefront.name }}
          </h3>
          
          <p v-if="storefront.description" class="text-xs text-text-secondary mb-2 line-clamp-2">
            {{ storefront.description }}
          </p>
        </router-link>

        <!-- Stats - Fixed to Bottom -->
        <div class="pt-2 border-t border-border-color mt-auto">
          <div class="flex items-start justify-between gap-2">
            <!-- Open Trades - Always Visible -->
            <div class="flex items-center gap-1 text-xs text-text-secondary flex-shrink-0">
              <Icon icon="mdi:swap-horizontal" class="w-3.5 h-3.5" />
              <span class="font-semibold">{{ openTrades }}</span>
              <span>{{ openTrades === 1 ? 'trade' : 'trades' }}</span>
            </div>
            
            <!-- Details Button - Opens modal -->
            <button
              @click.stop="showDetailsModal = true"
              class="flex items-center gap-0.5 text-xs text-text-secondary hover:text-primary-color transition-colors flex-shrink-0"
            >
              <span>Details</span>
              <Icon icon="mdi:information-outline" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <CollectionDetailsModal
      v-model:show="showDetailsModal"
      :storefront="storefront"
      :open-trades="openTrades"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import CollectionBadge from './CollectionBadge.vue'
import CollectionDetailsModal from './CollectionDetailsModal.vue'
import { getMarketplaceRoute } from '@/utils/constants'

const props = defineProps({
  storefront: {
    type: Object,
    required: true
  },
  openTrades: {
    type: Number,
    default: 0
  }
})

const imageError = ref(false)
const showDetailsModal = ref(false)

const handleImageError = () => {
  imageError.value = true
}
</script>
