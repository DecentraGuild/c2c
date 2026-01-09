<template>
  <nav class="bg-primary-bg/95 backdrop-blur-xl border-b border-border-color sticky top-0 z-50 safe-area-top safe-area-x">
    <div class="max-w-7xl mx-auto px-3 sm:px-4">
      <!-- Mobile Layout -->
      <div class="flex items-center justify-between h-14 sm:h-16 md:hidden">
        <!-- Logo and Name - Compact -->
        <router-link to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
          <img src="/dguild-logo-p2p.svg" alt="DecentraGuild Logo" class="w-8 h-8 sm:w-10 sm:h-10" />
          <div class="flex flex-col">
            <span class="text-sm sm:text-base font-bold text-gradient leading-tight">DecentraGuild</span>
            <span class="text-[10px] sm:text-xs text-text-muted leading-tight hidden sm:block">dGuild Escrow</span>
          </div>
        </router-link>

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
          <router-link
            to="/create"
            @click="mobileMenuOpen = false"
            class="px-4 py-3 text-sm font-semibold rounded-lg transition-all nav-link"
            :class="isActive('/create') 
              ? 'text-primary-color bg-primary-color/10' 
              : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/5'"
          >
            Create
          </router-link>
          <router-link
            to="/manage"
            @click="mobileMenuOpen = false"
            class="px-4 py-3 text-sm font-semibold rounded-lg transition-all nav-link"
            :class="isActive('/manage') 
              ? 'text-primary-color bg-primary-color/10' 
              : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/5'"
          >
            Manage
          </router-link>
        </div>
      </div>

      <!-- Desktop Layout -->
      <div class="hidden md:flex items-center h-16">
        <!-- Logo and Name -->
        <router-link to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
          <img src="/dguild-logo-p2p.svg" alt="DecentraGuild Logo" class="w-10 h-10" />
          <div class="flex flex-col">
            <span class="text-lg font-bold text-gradient leading-tight">DecentraGuild</span>
            <span class="text-xs text-text-muted leading-tight">dGuild Escrow</span>
          </div>
        </router-link>

        <!-- Navigation Tabs - Centered -->
        <div class="flex items-center gap-4 flex-1 justify-center">
          <router-link
            to="/create"
            class="px-4 py-2 text-sm font-semibold rounded-lg transition-all nav-link"
            :class="isActive('/create') 
              ? 'text-primary-color' 
              : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
          >
            Create
          </router-link>
          <router-link
            to="/manage"
            class="px-4 py-2 text-sm font-semibold rounded-lg transition-all nav-link"
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
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { WalletMultiButton } from 'solana-wallets-vue'

const route = useRoute()
const mobileMenuOpen = ref(false)

const isActive = (path) => {
  return route.path === path
}

// Close mobile menu when route changes
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>
