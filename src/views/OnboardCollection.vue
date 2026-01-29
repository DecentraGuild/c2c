<template>
  <div class="min-h-screen bg-primary-bg py-12 px-4 sm:px-6 lg:py-20">
    <div class="max-w-6xl mx-auto space-y-20">
      
      <!-- Hero Section -->
      <div class="text-center space-y-6">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-card-bg border-2 border-primary-color mb-4">
          <Icon icon="mdi:store" class="w-10 h-10 text-primary-color" />
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight max-w-4xl mx-auto">
          Your Marketplace.<br />
          <span class="text-primary-color">Your Brand.</span><br />
          Your Rules.
        </h1>
        <p class="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
          Launch a fully branded Solana marketplace in minutes. No technical expertise required. 
          Set your fees, choose your currencies, and start earning from every trade.
        </p>
      </div>

      <!-- Key Benefits -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-card-bg border border-border-color rounded-lg p-6 text-center">
          <Icon icon="mdi:currency-usd" class="w-12 h-12 text-primary-color mx-auto mb-4" />
          <h3 class="text-lg font-bold text-text-primary mb-2">Set Your Fees</h3>
          <p class="text-sm text-text-secondary">Monitize your own marketplace by adding a custom fee</p>
        </div>
        <div class="bg-card-bg border border-border-color rounded-lg p-6 text-center">
          <Icon icon="mdi:palette" class="w-12 h-12 text-primary-color mx-auto mb-4" />
          <h3 class="text-lg font-bold text-text-primary mb-2">Full Branding</h3>
          <p class="text-sm text-text-secondary">Customize everything to match your brand. It's your storefront.</p>
        </div>
        <div class="bg-card-bg border border-border-color rounded-lg p-6 text-center">
          <Icon icon="mdi:wallet" class="w-12 h-12 text-primary-color mx-auto mb-4" />
          <h3 class="text-lg font-bold text-text-primary mb-2">Multi-Currency</h3>
          <p class="text-sm text-text-secondary">Accept SOL, USDC, USDT, WBTC or setup your own token.</p>
        </div>
        <div class="bg-card-bg border border-border-color rounded-lg p-6 text-center">
          <Icon icon="mdi:shield-check" class="w-12 h-12 text-primary-color mx-auto mb-4" />
          <h3 class="text-lg font-bold text-text-primary mb-2">Royalties Protected</h3>
          <p class="text-sm text-text-secondary">Creator royalties are automatically respected on every trade.</p>
        </div>
      </div>

      <!-- Store Types Comparison -->
      <div class="space-y-8">
        <div class="text-center space-y-3">
          <h2 class="text-3xl sm:text-4xl font-bold text-text-primary">Start with Community Store</h2>
          <p class="text-lg text-text-secondary max-w-2xl mx-auto">
            All stores start at $50/month. Verify your collection ownership on-chain to unlock 
            Official Store features at no extra cost.
          </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-8">
          <!-- Community Store -->
          <div class="bg-card-bg border-2 border-border-color rounded-xl p-8 relative flex flex-col h-full">
            <div class="flex items-start justify-between mb-6">
              <div>
                <h3 class="text-2xl font-bold text-text-primary mb-2">Community Store</h3>
                <p class="text-text-secondary">Perfect for curators, traders, and communities</p>
              </div>
              <Icon icon="mdi:account-group" class="w-10 h-10 text-primary-color flex-shrink-0" />
            </div>
            
            <div class="space-y-4 flex-1">
              <div class="flex items-start gap-3">
                <Icon icon="mdi:check-circle" class="w-6 h-6 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-text-primary font-medium">Trade Everything</p>
                  <p class="text-sm text-text-secondary">List and trade NFTs, tokens, and digital assets</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <Icon icon="mdi:check-circle" class="w-6 h-6 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-text-primary font-medium">Up to 50 Mints</p>
                  <p class="text-sm text-text-secondary">Add multiple collections or token mints</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <Icon icon="mdi:check-circle" class="w-6 h-6 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-text-primary font-medium">Custom Marketplace Fees</p>
                  <p class="text-sm text-text-secondary">Set your own rates and earn on every transaction</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <Icon icon="mdi:check-circle" class="w-6 h-6 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-text-primary font-medium">Choose Your Currencies</p>
                  <p class="text-sm text-text-secondary">Accept SOL, USDC, or any SPL token</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <Icon icon="mdi:check-circle" class="w-6 h-6 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-text-primary font-medium">Complete Branding Control</p>
                  <p class="text-sm text-text-secondary">Customize colors, logos, and design</p>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-border-color mt-auto">
              <div class="text-center">
                <p class="text-3xl font-bold text-text-primary mb-1">$50<span class="text-lg text-text-secondary font-normal">/month</span></p>
                <p class="text-sm text-text-secondary">Base subscription</p>
              </div>
            </div>
          </div>

          <!-- Official Store Upgrade -->
          <div class="bg-card-bg border-2 border-primary-color rounded-xl p-8 relative shadow-lg shadow-primary-color/20 flex flex-col h-full">
            <div class="absolute top-4 right-4">
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-color/20 text-primary-color text-xs font-bold uppercase">
                <Icon icon="mdi:gift" class="w-4 h-4" />
                Free Upgrade
              </span>
            </div>
            
            <div class="flex items-start justify-between mb-6">
              <div>
                <h3 class="text-2xl font-bold text-text-primary mb-2">Official Store</h3>
                <p class="text-text-secondary">Unlock by verifying collection ownership</p>
              </div>
              <Icon icon="mdi:verified" class="w-10 h-10 text-primary-color flex-shrink-0" />
            </div>
            
            <div class="space-y-4 flex-1">
              <div class="flex items-start gap-3">
                <Icon icon="mdi:check-circle" class="w-6 h-6 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-text-primary font-medium">Official Verification Badge</p>
                  <p class="text-sm text-text-secondary">On-chain proof that you're the official issuer</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <Icon icon="mdi:check-circle" class="w-6 h-6 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-text-primary font-medium">Royalty Routing Control</p>
                  <p class="text-sm text-text-secondary">Control how royalties are distributed</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <Icon icon="mdi:check-circle" class="w-6 h-6 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-text-primary font-medium">One Custom Currency Free</p>
                  <p class="text-sm text-text-secondary">Add your own token at no extra cost</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <Icon icon="mdi:check-circle" class="w-6 h-6 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-text-primary font-medium">Enhanced Trust Signal</p>
                  <p class="text-sm text-text-secondary">Official badge increases buyer confidence</p>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-border-color mt-auto">
              <div class="text-center">
                <p class="text-3xl font-bold text-primary-color mb-1">FREE</p>
                <p class="text-sm text-text-secondary">Upgrade included when you verify</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing Details -->
      <div class="bg-card-bg border border-border-color rounded-xl p-8 lg:p-12">
        <div class="max-w-3xl mx-auto">
          <div class="text-center mb-10">
            <h2 class="text-3xl font-bold text-text-primary mb-3">Simple, Transparent Pricing</h2>
            <p class="text-lg text-text-secondary">No hidden fees. No surprises. Just straightforward pricing that scales with your needs.</p>
          </div>

          <div class="grid md:grid-cols-3 gap-8 mb-8">
            <div class="text-center py-6 px-4 rounded-lg bg-secondary-bg">
              <div class="text-4xl font-bold text-text-primary mb-2">$50</div>
              <div class="text-sm text-text-secondary mb-4">Base Monthly Fee</div>
              <div class="text-xs text-text-muted">Includes branded storefront</div>
            </div>
            <div class="text-center py-6 px-4 rounded-lg bg-secondary-bg">
              <div class="text-4xl font-bold text-text-primary mb-2">$1</div>
              <div class="text-sm text-text-secondary mb-4">Add Additional Asset</div>
              <div class="text-xs text-text-muted">50 mints included in base price</div>
            </div>
            <div class="text-center py-6 px-4 rounded-lg bg-secondary-bg">
              <div class="text-4xl font-bold text-text-primary mb-2">$5</div>
              <div class="text-sm text-text-secondary mb-4">Set Custom Currency</div>
              <div class="text-xs text-text-muted">First one free with verification</div>
            </div>
          </div>

          <div class="bg-secondary-bg rounded-lg py-6 px-4 border border-border-color mt-8">
            <div class="flex items-start gap-4">
              <Icon icon="mdi:currency-usd" class="w-6 h-6 text-primary-color flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <p class="text-text-primary font-medium mb-4">User Trading Fees</p>
                <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p class="text-sm text-text-secondary mb-1">Maker Fee</p>
                    <p class="text-2xl font-bold text-text-primary">{{ TRANSACTION_COSTS.PLATFORM_MAKER_FEE }} SOL</p>
                  </div>
                  <div>
                    <p class="text-sm text-text-secondary mb-1">Taker Fee</p>
                    <p class="text-2xl font-bold text-text-primary">{{ TRANSACTION_COSTS.PLATFORM_TAKER_FEE }} SOL</p>
                  </div>
                  <div>
                    <p class="text-sm text-text-secondary mb-1">Royalty</p>
                    <p class="text-2xl font-bold text-text-primary">Collection</p>
                    <p class="text-xs text-text-muted mt-1">depends on collection</p>
                  </div>
                  <div>
                    <p class="text-sm text-text-secondary mb-1">Store Monetization</p>
                    <p class="text-2xl font-bold text-text-primary">Custom</p>
                    <p class="text-xs text-text-muted mt-1">you set your fee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="text-center space-y-6 pb-12">
        <h2 class="text-3xl font-bold text-text-primary">Ready to Launch Your Marketplace?</h2>
        <p class="text-lg text-text-secondary max-w-2xl mx-auto">
          Get started in minutes. No credit card required for setup. 
          We'll help you configure everything exactly how you want it.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button class="px-8 py-4 bg-primary-color hover:bg-primary-hover text-white font-bold rounded-lg transition-colors flex items-center gap-2">
            <Icon icon="mdi:rocket-launch" class="w-5 h-5" />
            Get Started Now
          </button>
          <button class="px-8 py-4 bg-card-bg border border-border-color hover:border-primary-color text-text-primary font-bold rounded-lg transition-colors">
            Learn More
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { TRANSACTION_COSTS } from '../utils/constants/fees'
</script>
