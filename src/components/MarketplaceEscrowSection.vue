<template>
  <div v-if="escrows.length > 0" :class="sectionClass">
    <!-- Section Title -->
    <h2 v-if="title" class="text-base font-semibold text-text-primary mb-2.5 flex items-center gap-2">
      <Icon v-if="icon" :icon="icon" class="w-5 h-5" :class="iconClass" />
      <span>{{ title }} ({{ escrows.length }})</span>
    </h2>
    
    <!-- Card View Grid -->
    <div 
      v-if="viewMode === 'card'" 
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4"
    >
      <MarketplaceEscrowCard
        v-for="escrow in escrows"
        :key="escrow.id"
        :escrow="escrow"
        :collection="collection"
        :user-balances="userBalances"
        :view-mode="viewMode"
      />
    </div>
    
    <!-- List View -->
    <div v-else class="space-y-2 sm:space-y-2.5">
      <MarketplaceEscrowCard
        v-for="escrow in escrows"
        :key="escrow.id"
        :escrow="escrow"
        :collection="collection"
        :user-balances="userBalances"
        :view-mode="viewMode"
      />
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import MarketplaceEscrowCard from './MarketplaceEscrowCard.vue'

/**
 * Reusable section component for displaying escrows in card or list view
 * Eliminates duplicate template code in Marketplace.vue
 */
defineProps({
  /**
   * Array of escrows to display
   */
  escrows: {
    type: Array,
    required: true,
    default: () => []
  },
  
  /**
   * Section title (optional)
   */
  title: {
    type: String,
    default: null
  },
  
  /**
   * Icon name from iconify (optional)
   */
  icon: {
    type: String,
    default: null
  },
  
  /**
   * Icon CSS classes
   */
  iconClass: {
    type: String,
    default: 'text-primary-color'
  },
  
  /**
   * View mode: 'card' or 'list'
   */
  viewMode: {
    type: String,
    required: true,
    validator: (value) => ['card', 'list'].includes(value)
  },
  
  /**
   * Collection object
   */
  collection: {
    type: Object,
    required: true
  },
  
  /**
   * User token balances
   */
  userBalances: {
    type: Object,
    default: () => ({})
  },
  
  /**
   * Additional CSS classes for the section wrapper
   */
  sectionClass: {
    type: String,
    default: ''
  }
})
</script>
