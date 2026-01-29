<template>
  <nav class="bg-primary-bg/95 backdrop-blur-xl border-b border-border-color sticky top-0 z-50 safe-area-top safe-area-x">
    <div class="max-w-7xl mx-auto px-3 sm:px-4">
      <!-- Mobile Layout -->
      <div class="flex items-center justify-between h-14 sm:h-16 md:hidden">
        <!-- Logo -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <router-link to="/" class="flex items-center hover:opacity-80 transition-opacity">
            <img src="/dguild-logo-p2p.svg" alt="DecentraGuild Logo" class="w-8 h-8 sm:w-10 sm:h-10" />
          </router-link>
        </div>

        <!-- Mobile Menu Button and Wallet -->
        <div class="flex items-center gap-2">
          <div class="wallet-button-custom">
            <WalletMultiButton dark />
          </div>
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="p-2 text-text-secondary hover:text-primary-color transition-colors"
            aria-label="Toggle menu"
          >
            <Icon :icon="mobileMenuOpen ? 'mdi:close' : 'mdi:menu'" class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Menu -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden border-t border-border-color bg-primary-bg/98 backdrop-blur-xl"
      >
        <div class="flex flex-col py-2">
          <!-- Collection Selector -->
          <div class="px-4 py-2 border-b border-border-color mb-2">
            <NavBarCollectionSelector
              v-model="selectedCollectionId"
              @update:modelValue="handleCollectionChange"
            />
          </div>

          <!-- Platform Navigation -->
          <div class="px-2 mb-2">
            <div class="text-xs font-semibold text-text-muted uppercase px-2 mb-1">Platform</div>
            <router-link
              to="/"
              @click="mobileMenuOpen = false"
              class="px-4 py-3 text-sm font-semibold rounded-lg transition-all nav-link block"
              :class="isActive('/') 
                ? 'text-primary-color bg-primary-color/10' 
                : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/5'"
            >
              Explore
            </router-link>
            <router-link
              to="/onboard"
              @click="mobileMenuOpen = false"
              class="px-4 py-3 text-sm font-semibold rounded-lg transition-all nav-link block"
              :class="isActive('/onboard') 
                ? 'text-primary-color bg-primary-color/10' 
                : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/5'"
            >
              Host
            </router-link>
          </div>

          <!-- Collection Navigation -->
          <div class="px-2">
            <div class="text-xs font-semibold text-text-muted uppercase px-2 mb-1">Collection</div>
            <router-link
              to="/marketplace"
              @click="mobileMenuOpen = false"
              class="px-4 py-3 text-sm font-semibold rounded-lg transition-all nav-link block"
              :class="isActive('/marketplace') 
                ? 'text-primary-color bg-primary-color/10' 
                : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/5'"
            >
              Marketplace
            </router-link>
            <router-link
              to="/create"
              @click="mobileMenuOpen = false"
              class="px-4 py-3 text-sm font-semibold rounded-lg transition-all nav-link block"
              :class="isActive('/create') 
                ? 'text-primary-color bg-primary-color/10' 
                : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/5'"
            >
              Create
            </router-link>
            <router-link
              to="/manage"
              @click="mobileMenuOpen = false"
              class="px-4 py-3 text-sm font-semibold rounded-lg transition-all nav-link block"
              :class="isActive('/manage') 
                ? 'text-primary-color bg-primary-color/10' 
                : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/5'"
            >
              Manage
            </router-link>
          </div>
        </div>
      </div>

      <!-- Desktop Layout - Single Adaptive Layer -->
      <div class="hidden md:flex items-center h-14 transition-all duration-300">
        <!-- Platform Context: Show when on platform routes OR when no collection selected -->
        <template v-if="isPlatformRoute || !selectedCollectionId">
          <!-- Logo/Brand - Left -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <router-link to="/" class="flex items-center hover:opacity-80 transition-opacity">
              <img src="/dguild-logo-p2p.svg" alt="DecentraGuild Logo" class="w-8 h-8" />
            </router-link>
          </div>

          <!-- Platform Navigation Links - Centered -->
          <div class="flex-1 flex items-center justify-center gap-4">
            <router-link
              to="/"
              class="px-3 py-2 text-sm font-semibold rounded-lg transition-all nav-link"
              :class="isActive('/') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              Explore
            </router-link>
            <router-link
              to="/onboard"
              class="px-3 py-2 text-sm font-semibold rounded-lg transition-all nav-link"
              :class="isActive('/onboard') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              Host
            </router-link>
          </div>

          <!-- Wallet Connect Button - Right -->
          <div class="flex-shrink-0 wallet-button-custom">
            <WalletMultiButton dark />
          </div>
        </template>

        <!-- Collection Context: Show when collection selected AND on collection routes -->
        <template v-else-if="selectedCollectionId && isCollectionRoute">
          <!-- Collection Logo - Left (fit height, auto width) -->
          <div class="flex items-center gap-2 flex-shrink-0 h-8">
            <img
              v-if="selectedCollection?.logo"
              :src="selectedCollection.logo"
              :alt="selectedCollection.name"
              class="h-full w-auto object-contain rounded hover:opacity-80 transition-opacity"
            />
            <Icon
              v-else
              icon="mdi:image-off"
              class="h-8 w-8 text-text-muted"
            />
          </div>

          <!-- Collection Selector - Next to Logo (with spacing) -->
          <div class="flex items-center gap-2 flex-shrink-0 ml-3">
            <NavBarCollectionSelector
              v-model="selectedCollectionId"
              hide-logo
              @update:modelValue="handleCollectionChange"
            />
          </div>

          <!-- Collection Navigation Tabs - Centered -->
          <div class="flex-1 flex items-center justify-center gap-2">
            <router-link
              to="/marketplace"
              class="px-3 py-2 text-sm font-semibold rounded-lg transition-all nav-link"
              :class="isActive('/marketplace') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              Marketplace
            </router-link>
            <router-link
              to="/create"
              class="px-3 py-2 text-sm font-semibold rounded-lg transition-all nav-link"
              :class="isActive('/create') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              Create
            </router-link>
            <router-link
              to="/manage"
              class="px-3 py-2 text-sm font-semibold rounded-lg transition-all nav-link"
              :class="isActive('/manage') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              Manage
            </router-link>
          </div>

          <!-- Wallet Connect Button - Right -->
          <div class="flex-shrink-0 wallet-button-custom">
            <WalletMultiButton dark />
          </div>
        </template>

        <!-- Fallback: Platform nav when collection selected but on non-collection route (e.g., escrow detail) -->
        <template v-else>
          <!-- Logo/Brand - Left -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <router-link to="/" class="flex items-center hover:opacity-80 transition-opacity">
              <img src="/dguild-logo-p2p.svg" alt="DecentraGuild Logo" class="w-8 h-8" />
            </router-link>
          </div>

          <!-- Platform Navigation Links - Centered -->
          <div class="flex-1 flex items-center justify-center gap-4">
            <router-link
              to="/"
              class="px-3 py-2 text-sm font-semibold rounded-lg transition-all nav-link"
              :class="isActive('/') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              Explore
            </router-link>
            <router-link
              to="/onboard"
              class="px-3 py-2 text-sm font-semibold rounded-lg transition-all nav-link"
              :class="isActive('/onboard') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              Host
            </router-link>
          </div>

          <!-- Wallet Connect Button - Right -->
          <div class="flex-shrink-0 wallet-button-custom">
            <WalletMultiButton dark />
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { WalletMultiButton } from 'solana-wallets-vue'
import NavBarCollectionSelector from './NavBarCollectionSelector.vue'
import { useCollectionStore } from '../stores/collection'

const route = useRoute()
const router = useRouter()
const collectionStore = useCollectionStore()
const mobileMenuOpen = ref(false)

const selectedCollectionId = computed({
  get: () => collectionStore.selectedCollectionId,
  set: (value) => collectionStore.setSelectedCollection(value)
})

const selectedCollection = computed(() => collectionStore.selectedCollection)

const isActive = (path) => {
  return route.path === path
}

// Determine if we're on a platform route (not collection-specific)
const isPlatformRoute = computed(() => {
  return route.path === '/' || route.path === '/onboard'
})

// Determine if we're on a collection route
const isCollectionRoute = computed(() => {
  return ['/marketplace', '/create', '/manage'].includes(route.path)
})

const handleCollectionChange = (collectionId) => {
  // If clearing selection (null), navigate to platform route if on collection route
  if (!collectionId && isCollectionRoute.value) {
    router.push('/')
    return
  }
  
  // Update URL if on marketplace page
  if (route.path === '/marketplace') {
    router.replace({ query: { collection: collectionId } })
  }
}

// Close mobile menu when route changes
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})

// Load collections on mount
onMounted(async () => {
  if (collectionStore.collections.length === 0) {
    await collectionStore.loadCollections()
  }
})
</script>
