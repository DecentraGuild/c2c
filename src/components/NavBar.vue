<template>
  <nav class="bg-primary-bg/95 backdrop-blur-xl border-b border-border-color sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center h-16">
        <!-- Logo and Name -->
        <router-link to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
          <img src="/dguild-logo.png" alt="DecentraGuild Logo" class="w-10 h-10" />
          <div class="flex flex-col">
            <span class="text-lg font-bold text-gradient leading-tight">DecentraGuild</span>
            <span class="text-xs text-text-muted leading-tight">dGuild Escrow</span>
          </div>
        </router-link>

        <!-- Navigation Tabs - Centered -->
        <div class="flex items-center gap-4 flex-1 justify-center">
          <router-link
            to="/create"
            class="px-4 py-2 text-sm font-semibold rounded-lg transition-all"
            :class="isActive('/create') 
              ? 'text-primary-color' 
              : 'text-text-secondary hover:text-primary-color transition-all duration-300'"
          >
            Create
          </router-link>
          <router-link
            to="/manage"
            class="px-4 py-2 text-sm font-semibold rounded-lg transition-all"
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
import { useRoute } from 'vue-router'
import { WalletMultiButton } from 'solana-wallets-vue'

const route = useRoute()

const isActive = (path) => {
  return route.path === path
}
</script>
