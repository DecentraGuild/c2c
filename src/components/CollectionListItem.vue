<template>
  <div
    class="card hover:border-primary-color/50 transition-all duration-200 hover:shadow-lg group"
  >
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Badge at Top (Mobile) / Left Side (Desktop) -->
      <div class="flex justify-center sm:justify-start sm:w-28 flex-shrink-0">
        <CollectionBadge
          :verification-status="collection.verification_status || (collection.verified ? 'verified' : 'community')"
          size="sm"
        />
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3">
          <!-- Collection Image -->
          <router-link
            :to="`/marketplace?storefront=${collection.id}`"
            class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-secondary-bg flex items-center justify-center flex-shrink-0 cursor-pointer"
          >
            <img
              v-if="collection.logo && !imageError"
              :src="collection.logo"
              :alt="collection.name"
              class="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-200"
              @error="handleImageError"
            />
            <Icon
              v-else
              icon="mdi:image-off"
              class="w-8 h-8 text-text-muted/30"
            />
          </router-link>

          <!-- Collection Info -->
          <div class="flex-1 min-w-0">
            <!-- Title and Description -->
            <router-link
              :to="`/marketplace?storefront=${collection.id}`"
              class="cursor-pointer block mb-2"
            >
              <h3 class="text-sm sm:text-base font-bold text-text-primary group-hover:text-primary-color transition-colors mb-0.5">
                {{ collection.name }}
              </h3>
              <p v-if="collection.description" class="text-xs text-text-secondary line-clamp-2">
                {{ collection.description }}
              </p>
            </router-link>

            <!-- Stats Row -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <!-- Open Trades - Always Visible -->
              <div class="flex items-center gap-1.5 text-xs text-text-secondary">
                <Icon icon="mdi:swap-horizontal" class="w-3.5 h-3.5" />
                <span class="font-semibold">{{ openTrades }}</span>
                <span>{{ openTrades === 1 ? 'trade' : 'trades' }}</span>
              </div>
              
              <!-- Details Button - Opens modal -->
              <button
                @click.stop="showDetailsModal = true"
                class="flex items-center gap-1 text-xs text-text-secondary hover:text-primary-color transition-colors"
              >
                <span>Details</span>
                <Icon icon="mdi:information-outline" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Arrow Icon -->
          <router-link
            :to="`/marketplace?storefront=${collection.id}`"
            class="flex-shrink-0 text-text-muted group-hover:text-primary-color transition-colors hidden sm:block cursor-pointer"
          >
            <Icon icon="mdi:chevron-right" class="w-6 h-6" />
          </router-link>
        </div>
      </div>
    </div>

    <CollectionDetailsModal
      v-model:show="showDetailsModal"
      :collection="collection"
      :open-trades="openTrades"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import CollectionBadge from './CollectionBadge.vue'
import CollectionDetailsModal from './CollectionDetailsModal.vue'

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
const showDetailsModal = ref(false)

const handleImageError = () => {
  imageError.value = true
}
</script>
