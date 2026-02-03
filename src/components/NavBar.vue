<template>
  <nav
    class="bg-primary-bg/95 backdrop-blur-xl border-b border-border-color sticky top-0 z-50 safe-area-top safe-area-x overflow-visible"
    :class="{ 'z-[100]': mobileMenuOpen }"
  >
    <div class="max-w-7xl mx-auto px-3 sm:px-4 overflow-visible">
      <!-- Compact Layout (below lg): layer-specific icon row -->
      <div class="flex items-center justify-between h-12 sm:h-14 nav-compact:hidden gap-1">
        <!-- Logo: platform = own logo, storefront = storefront logo -->
        <div class="flex items-center gap-2 flex-shrink-0 h-7 sm:h-8">
          <router-link
            v-if="isPlatformRoute || !selectedStorefrontId || (selectedStorefrontId && !isCollectionRoute)"
            to="/"
            class="flex items-center h-full hover:opacity-80 transition-opacity"
          >
            <img src="/dguild-logo-p2p.svg" alt="DecentraGuild Logo" class="h-full w-auto" />
          </router-link>
          <router-link
            v-else
            :to="{ path: '/marketplace', query: { storefront: selectedStorefrontId } }"
            class="flex items-center h-full hover:opacity-80 transition-opacity"
          >
            <img
              v-if="selectedStorefront?.logo"
              :src="selectedStorefront.logo"
              :alt="selectedStorefront.name"
              class="h-full w-auto object-contain rounded"
            />
            <Icon v-else icon="mdi:image-off" class="h-full w-7 sm:w-8 text-text-muted" aria-hidden="true" />
          </router-link>
        </div>

        <!-- Platform bar: Explore, Host, Wallet, Menu -->
        <template v-if="isPlatformRoute || !selectedStorefrontId || (selectedStorefrontId && !isCollectionRoute)">
          <div class="flex-1 flex items-center justify-end gap-0.5 sm:gap-1">
            <router-link
              to="/"
              aria-label="Explore"
              class="nav-icon-btn rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
              :class="isActive('/') ? 'nav-icon-btn-active' : 'nav-icon-btn-inactive'"
            >
              <Icon icon="mdi:compass-outline" class="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
            </router-link>
            <router-link
              to="/onboard"
              aria-label="Host"
              class="nav-icon-btn rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
              :class="isActive('/onboard') ? 'nav-icon-btn-active' : 'nav-icon-btn-inactive'"
            >
              <Icon icon="mdi:domain" class="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
            </router-link>
            <div class="wallet-button-custom wallet-button-compact flex-shrink-0">
              <WalletMultiButton dark />
            </div>
            <div class="relative z-20 flex-shrink-0">
              <button
                type="button"
                aria-label="Menu"
                :aria-expanded="mobileMenuOpen"
                class="nav-icon-btn nav-icon-btn-inactive rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
                @click.stop="toggleMenu"
              >
                <Icon :icon="mobileMenuOpen ? 'mdi:close' : 'mdi:menu'" class="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
              </button>
            </div>
          </div>
        </template>

        <!-- Storefront bar: Marketplace, Create, Manage, Wallet, Menu (no selector on bar) -->
        <template v-else>
          <div class="flex-1 flex items-center justify-end gap-0.5 sm:gap-1">
            <router-link
              to="/marketplace"
              aria-label="Marketplace"
              class="nav-icon-btn rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
              :class="isActive('/marketplace') ? 'nav-icon-btn-active' : 'nav-icon-btn-inactive'"
            >
              <Icon icon="mdi:storefront-outline" class="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
            </router-link>
            <router-link
              to="/create"
              aria-label="Create"
              class="nav-icon-btn rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
              :class="isActive('/create') ? 'nav-icon-btn-active' : 'nav-icon-btn-inactive'"
            >
              <Icon icon="mdi:plus-circle-outline" class="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
            </router-link>
            <router-link
              to="/manage"
              aria-label="Manage"
              class="nav-icon-btn rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
              :class="isActive('/manage') ? 'nav-icon-btn-active' : 'nav-icon-btn-inactive'"
            >
              <Icon icon="mdi:clipboard-list-outline" class="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
            </router-link>
            <div class="wallet-button-custom wallet-button-compact flex-shrink-0">
              <WalletMultiButton dark />
            </div>
            <div class="relative z-20 flex-shrink-0">
              <button
                type="button"
                aria-label="Menu"
                :aria-expanded="mobileMenuOpen"
                class="nav-icon-btn nav-icon-btn-inactive rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
                @click.stop="toggleMenu"
              >
                <Icon :icon="mobileMenuOpen ? 'mdi:close' : 'mdi:menu'" class="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- Compact slide-down menu (right-aligned) -->
      <div
        v-if="mobileMenuOpen"
        class="nav-compact:hidden border-t border-border-color bg-primary-bg/98 backdrop-blur-xl relative z-10 flex justify-end"
      >
        <div class="flex flex-col py-2 w-full max-w-sm">
          <!-- Storefront Selector -->
          <div class="px-4 py-2 border-b border-border-color mb-2">
            <NavBarCollectionSelector
              v-model="selectedStorefrontId"
              @update:modelValue="handleStorefrontChange"
            />
          </div>

          <!-- Platform Navigation -->
          <div class="px-2 mb-2">
            <div class="text-xs font-semibold text-text-muted uppercase px-2 mb-1">Platform</div>
            <router-link
              to="/"
              @click="mobileMenuOpen = false"
              class="px-4 py-3 text-sm font-semibold rounded-lg transition-all nav-link flex items-center gap-3"
              :class="isActive('/') 
                ? 'text-primary-color bg-primary-color/10' 
                : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/5'"
            >
              <Icon icon="mdi:compass-outline" class="w-5 h-5 flex-shrink-0" />
              Explore
            </router-link>
            <router-link
              to="/onboard"
              @click="mobileMenuOpen = false"
              class="px-4 py-3 text-sm font-semibold rounded-lg transition-all nav-link flex items-center gap-3"
              :class="isActive('/onboard') 
                ? 'text-primary-color bg-primary-color/10' 
                : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/5'"
            >
              <Icon icon="mdi:domain" class="w-5 h-5 flex-shrink-0" />
              Host
            </router-link>
          </div>

          <!-- Storefront Navigation -->
          <div class="px-2">
            <div class="text-xs font-semibold text-text-muted uppercase px-2 mb-1">Storefront</div>
            <router-link
              to="/marketplace"
              @click="mobileMenuOpen = false"
              class="px-4 py-3 text-sm font-semibold rounded-lg transition-all nav-link flex items-center gap-3"
              :class="isActive('/marketplace') 
                ? 'text-primary-color bg-primary-color/10' 
                : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/5'"
            >
              <Icon icon="mdi:storefront-outline" class="w-5 h-5 flex-shrink-0" />
              Marketplace
            </router-link>
            <router-link
              to="/create"
              @click="mobileMenuOpen = false"
              class="px-4 py-3 text-sm font-semibold rounded-lg transition-all nav-link flex items-center gap-3"
              :class="isActive('/create') 
                ? 'text-primary-color bg-primary-color/10' 
                : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/5'"
            >
              <Icon icon="mdi:plus-circle-outline" class="w-5 h-5 flex-shrink-0" />
              Create
            </router-link>
            <router-link
              to="/manage"
              @click="mobileMenuOpen = false"
              class="px-4 py-3 text-sm font-semibold rounded-lg transition-all nav-link flex items-center gap-3"
              :class="isActive('/manage') 
                ? 'text-primary-color bg-primary-color/10' 
                : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/5'"
            >
              <Icon icon="mdi:clipboard-list-outline" class="w-5 h-5 flex-shrink-0" />
              Manage
            </router-link>
          </div>
        </div>
      </div>

      <!-- Full bar (lg and up) -->
      <div class="hidden nav-compact:flex items-center h-12 transition-all duration-300">
        <!-- Platform Context: Show when on platform routes OR when no storefront selected -->
        <template v-if="isPlatformRoute || !selectedStorefrontId">
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
              class="px-3 py-2 text-sm font-semibold rounded-lg transition-all nav-link flex items-center gap-2"
              :class="isActive('/') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              <Icon icon="mdi:compass-outline" class="w-5 h-5 flex-shrink-0" />
              Explore
            </router-link>
            <router-link
              to="/onboard"
              class="px-3 py-2 text-sm font-semibold rounded-lg transition-all nav-link flex items-center gap-2"
              :class="isActive('/onboard') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              <Icon icon="mdi:domain" class="w-5 h-5 flex-shrink-0" />
              Host
            </router-link>
          </div>

          <!-- Wallet Connect Button - Right -->
          <div class="flex-shrink-0 wallet-button-custom">
            <WalletMultiButton dark />
          </div>
        </template>

        <!-- Storefront Context: Show when storefront selected AND on storefront routes -->
        <template v-else-if="selectedStorefrontId && isCollectionRoute">
          <!-- Storefront Logo - Left (fit height, auto width) -->
          <div class="flex items-center gap-2 flex-shrink-0 h-7">
            <img
              v-if="selectedStorefront?.logo"
              :src="selectedStorefront.logo"
              :alt="selectedStorefront.name"
              class="h-full w-auto object-contain rounded hover:opacity-80 transition-opacity"
            />
            <Icon
              v-else
              icon="mdi:image-off"
              class="h-7 w-7 text-text-muted"
            />
          </div>

          <!-- Storefront Selector - Next to Logo (with spacing) -->
          <div class="flex items-center gap-2 flex-shrink-0 ml-2">
            <NavBarCollectionSelector
              v-model="selectedStorefrontId"
              hide-logo
              @update:modelValue="handleStorefrontChange"
            />
          </div>

          <!-- Storefront Navigation Tabs - Centered -->
          <div class="flex-1 flex items-center justify-center gap-1.5">
            <router-link
              to="/marketplace"
              class="px-2.5 py-1.5 text-sm font-semibold rounded-lg transition-all nav-link flex items-center gap-2"
              :class="isActive('/marketplace') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              <Icon icon="mdi:storefront-outline" class="w-5 h-5 flex-shrink-0" />
              Marketplace
            </router-link>
            <router-link
              to="/create"
              class="px-2.5 py-1.5 text-sm font-semibold rounded-lg transition-all nav-link flex items-center gap-2"
              :class="isActive('/create') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              <Icon icon="mdi:plus-circle-outline" class="w-5 h-5 flex-shrink-0" />
              Create
            </router-link>
            <router-link
              to="/manage"
              class="px-2.5 py-1.5 text-sm font-semibold rounded-lg transition-all nav-link flex items-center gap-2"
              :class="isActive('/manage') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              <Icon icon="mdi:clipboard-list-outline" class="w-5 h-5 flex-shrink-0" />
              Manage
            </router-link>
          </div>

          <!-- Wallet Connect Button - Right -->
          <div class="flex-shrink-0 wallet-button-custom">
            <WalletMultiButton dark />
          </div>
        </template>

        <!-- Fallback: Platform nav when storefront selected but on non-storefront route (e.g., escrow detail) -->
        <template v-else>
          <!-- Logo/Brand - Left -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <router-link to="/" class="flex items-center hover:opacity-80 transition-opacity">
              <img src="/dguild-logo-p2p.svg" alt="DecentraGuild Logo" class="w-7 h-7" />
            </router-link>
          </div>

          <!-- Platform Navigation Links - Centered -->
          <div class="flex-1 flex items-center justify-center gap-3">
            <router-link
              to="/"
              class="px-2.5 py-1.5 text-sm font-semibold rounded-lg transition-all nav-link flex items-center gap-2"
              :class="isActive('/') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              <Icon icon="mdi:compass-outline" class="w-5 h-5 flex-shrink-0" />
              Explore
            </router-link>
            <router-link
              to="/onboard"
              class="px-2.5 py-1.5 text-sm font-semibold rounded-lg transition-all nav-link flex items-center gap-2"
              :class="isActive('/onboard') 
                ? 'text-primary-color' 
                : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
            >
              <Icon icon="mdi:domain" class="w-5 h-5 flex-shrink-0" />
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
import { useStorefrontStore } from '@/stores/storefront'

const route = useRoute()
const router = useRouter()
const storefrontStore = useStorefrontStore()
const mobileMenuOpen = ref(false)

const selectedStorefrontId = computed({
  get: () => storefrontStore.selectedStorefrontId,
  set: (value) => storefrontStore.setSelectedStorefront(value)
})

const selectedStorefront = computed(() => storefrontStore.selectedStorefront)

const isActive = (path) => {
  return route.path === path
}

// Determine if we're on a platform route (not storefront-specific)
const isPlatformRoute = computed(() => {
  return route.path === '/' || route.path === '/onboard'
})

// Determine if we're on a storefront route (including escrow detail so storefront shows)
const isCollectionRoute = computed(() => {
  return ['/marketplace', '/create', '/manage'].includes(route.path) || route.path.startsWith('/escrow/')
})

const toggleMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const handleStorefrontChange = (storefrontId) => {
  // If clearing selection (null), navigate to platform route if on storefront route
  if (!storefrontId && isCollectionRoute.value) {
    router.push('/')
    return
  }
  
  // Update URL if on marketplace page
  if (route.path === '/marketplace') {
    router.replace({ query: { storefront: storefrontId } })
  }
}

// Close mobile menu when route changes
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})

onMounted(async () => {
  if (storefrontStore.storefronts.length === 0) {
    await storefrontStore.loadStorefronts()
  }
})
</script>

<style scoped>
.nav-icon-btn {
  width: 2.5rem;
  height: 2.5rem;
  min-width: 2.5rem;
  min-height: 2.5rem;
  transition: color 0.2s, background-color 0.2s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
@media (min-width: 640px) {
  .nav-icon-btn {
    width: 2.75rem;
    height: 2.75rem;
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
}
.nav-icon-btn-active {
  color: var(--theme-text-primary);
  background-color: var(--theme-primary);
}
.nav-icon-btn-active:hover {
  opacity: 0.9;
}
.nav-icon-btn-inactive {
  color: var(--theme-text-secondary);
  background-color: transparent;
}
.nav-icon-btn-inactive:hover {
  color: var(--theme-primary);
  background-color: color-mix(in srgb, var(--theme-primary) 12%, transparent);
}
</style>
