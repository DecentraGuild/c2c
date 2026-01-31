<template>
  <div class="min-h-screen bg-primary-bg py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto space-y-8">
      
      <!-- Hero Section -->
      <div class="text-center space-y-3">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-card-bg border-2 border-primary-color mb-2">
          <Icon icon="mdi:store" class="w-7 h-7 text-primary-color" />
        </div>
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary leading-tight max-w-3xl mx-auto">
          Your Marketplace.<br />
          <span class="text-primary-color">Your Brand.</span><br />
          Your Rules.
        </h1>
        <p class="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Launch a fully branded Solana marketplace in minutes. No technical expertise required. 
          Set your fees, choose your currencies, and start earning from every trade.
        </p>
      </div>

      <!-- Key Benefits -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-card-bg border border-border-color rounded-lg p-4 text-center">
          <Icon icon="mdi:currency-usd" class="w-10 h-10 text-primary-color mx-auto mb-3" />
          <h3 class="text-base font-bold text-text-primary mb-1.5">Set Your Fees</h3>
          <p class="text-xs text-text-secondary">Monitize your own marketplace by adding a custom fee</p>
        </div>
        <div class="bg-card-bg border border-border-color rounded-lg p-4 text-center">
          <Icon icon="mdi:palette" class="w-10 h-10 text-primary-color mx-auto mb-3" />
          <h3 class="text-base font-bold text-text-primary mb-1.5">Full Branding</h3>
          <p class="text-xs text-text-secondary">Customize everything to match your brand. It's your storefront.</p>
        </div>
        <div class="bg-card-bg border border-border-color rounded-lg p-4 text-center">
          <Icon icon="mdi:wallet" class="w-10 h-10 text-primary-color mx-auto mb-3" />
          <h3 class="text-base font-bold text-text-primary mb-1.5">Multi-Currency</h3>
          <p class="text-xs text-text-secondary">Accept USDC, USDT, SOL, WBTC. Custom tokens available as add-on.</p>
        </div>
        <div class="bg-card-bg border border-border-color rounded-lg p-4 text-center">
          <Icon icon="mdi:shield-check" class="w-10 h-10 text-primary-color mx-auto mb-3" />
          <h3 class="text-base font-bold text-text-primary mb-1.5">Royalties Protected</h3>
          <p class="text-xs text-text-secondary">Creator royalties are automatically respected on every trade.</p>
        </div>
      </div>

      <!-- Store Types Comparison -->
      <div class="space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-xl sm:text-2xl font-bold text-text-primary">Start with Community Store</h2>
          <p class="text-base text-text-secondary max-w-2xl mx-auto">
            All stores start at $50/month. Verify your collection ownership on-chain to unlock 
            Official Store features at no extra cost.
          </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-6">
          <!-- Community Store -->
          <div class="bg-card-bg border-2 border-border-color rounded-xl p-5 relative flex flex-col h-full">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-lg font-bold text-text-primary mb-1.5">Community Store</h3>
                <p class="text-sm text-text-secondary">Perfect for curators, traders, and communities</p>
              </div>
              <Icon icon="mdi:account-group" class="w-8 h-8 text-primary-color flex-shrink-0" />
            </div>
            
            <div class="space-y-3 flex-1">
              <div class="flex items-start gap-2.5">
                <Icon icon="mdi:check-circle" class="w-5 h-5 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm text-text-primary font-medium">Trade Everything</p>
                  <p class="text-xs text-text-secondary">List and trade NFTs, tokens, and digital assets</p>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <Icon icon="mdi:check-circle" class="w-5 h-5 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm text-text-primary font-medium">Up to 250 Mints</p>
                  <p class="text-xs text-text-secondary">Add multiple collections or token mints</p>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <Icon icon="mdi:check-circle" class="w-5 h-5 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm text-text-primary font-medium">Custom Marketplace Fees</p>
                  <p class="text-xs text-text-secondary">Set your own rates and earn on every transaction</p>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <Icon icon="mdi:check-circle" class="w-5 h-5 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm text-text-primary font-medium">Standard Currencies</p>
                  <p class="text-xs text-text-secondary">Accept USDC, USDT, SOL, WBTC (custom tokens available as add-on)</p>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <Icon icon="mdi:check-circle" class="w-5 h-5 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm text-text-primary font-medium">Complete Branding Control</p>
                  <p class="text-xs text-text-secondary">Customize colors, logos, and design</p>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-border-color mt-auto">
              <div class="text-center">
                <p class="text-2xl font-bold text-text-primary mb-0.5">$50<span class="text-base text-text-secondary font-normal">/month</span></p>
                <p class="text-xs text-text-secondary">Base subscription</p>
              </div>
            </div>
          </div>

          <!-- Official Store Upgrade -->
          <div class="bg-card-bg border-2 border-primary-color rounded-xl p-5 relative shadow-lg shadow-primary-color/20 flex flex-col h-full">
            <div class="absolute top-3 right-3">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-color/20 text-primary-color text-xs font-bold uppercase">
                <Icon icon="mdi:gift" class="w-3.5 h-3.5" />
                Free Upgrade
              </span>
            </div>
            
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-lg font-bold text-text-primary mb-1.5">Official Store</h3>
                <p class="text-sm text-text-secondary">Unlock by verifying collection ownership</p>
              </div>
              <Icon icon="mdi:verified" class="w-8 h-8 text-primary-color flex-shrink-0" />
            </div>
            
            <div class="space-y-3 flex-1">
              <div class="flex items-start gap-2.5">
                <Icon icon="mdi:check-circle" class="w-5 h-5 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm text-text-primary font-medium">Official Verification Badge</p>
                  <p class="text-xs text-text-secondary">On-chain proof that you're the official issuer</p>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <Icon icon="mdi:check-circle" class="w-5 h-5 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm text-text-primary font-medium">Royalty Routing Control</p>
                  <p class="text-xs text-text-secondary">Control how royalties are distributed</p>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <Icon icon="mdi:check-circle" class="w-5 h-5 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm text-text-primary font-medium">One Custom Currency Free</p>
                  <p class="text-xs text-text-secondary">Add your own token at no extra cost</p>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <Icon icon="mdi:check-circle" class="w-5 h-5 text-primary-color flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm text-text-primary font-medium">Enhanced Trust Signal</p>
                  <p class="text-xs text-text-secondary">Official badge increases buyer confidence</p>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-border-color mt-auto">
              <div class="text-center">
                <p class="text-2xl font-bold text-primary-color mb-0.5">FREE</p>
                <p class="text-xs text-text-secondary">Upgrade included when you verify</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing Details -->
      <div class="bg-card-bg border border-border-color rounded-xl p-5 lg:p-8">
        <div class="max-w-3xl mx-auto">
          <div class="text-center mb-6">
            <h2 class="text-xl font-bold text-text-primary mb-2">Simple, Transparent Pricing</h2>
            <p class="text-base text-text-secondary">No hidden fees. No surprises. Just straightforward pricing that scales with your needs.</p>
          </div>

          <div class="grid md:grid-cols-3 gap-4 mb-6">
            <div class="text-center py-4 px-3 rounded-lg bg-secondary-bg">
              <div class="text-3xl font-bold text-text-primary mb-1.5">$50</div>
              <div class="text-sm text-text-secondary mb-2">Base Monthly Fee</div>
              <div class="text-xs text-text-muted">Includes branded storefront + 250 mints</div>
            </div>
            <div class="text-center py-4 px-3 rounded-lg bg-secondary-bg">
              <div class="text-3xl font-bold text-text-primary mb-1.5">$10</div>
              <div class="text-sm text-text-secondary mb-2">Per 50 Additional Mints</div>
              <div class="text-xs text-text-muted">per month - 250 mints included in base</div>
            </div>
            <div class="text-center py-4 px-3 rounded-lg bg-secondary-bg">
              <div class="text-3xl font-bold text-text-primary mb-1.5">$5</div>
              <div class="text-sm text-text-secondary mb-2">Custom Currency Add-on</div>
              <div class="text-xs text-text-muted">per month - first free with verification</div>
            </div>
          </div>

          <div class="bg-secondary-bg rounded-lg py-4 px-3 border border-border-color mt-6">
            <div class="flex items-start gap-3">
              <Icon icon="mdi:currency-usd" class="w-5 h-5 text-primary-color flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm text-text-primary font-medium mb-3">User Trading Fees</p>
                <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p class="text-xs text-text-secondary mb-1">Maker Fee</p>
                    <p class="text-lg font-bold text-text-primary">{{ TRANSACTION_COSTS.PLATFORM_MAKER_FEE }} SOL</p>
                  </div>
                  <div>
                    <p class="text-xs text-text-secondary mb-1">Taker Fee</p>
                    <p class="text-lg font-bold text-text-primary">{{ TRANSACTION_COSTS.PLATFORM_TAKER_FEE }} SOL</p>
                  </div>
                  <div>
                    <p class="text-xs text-text-secondary mb-1">Royalty</p>
                    <p class="text-lg font-bold text-text-primary">Collection</p>
                    <p class="text-xs text-text-muted mt-0.5">depends on collection</p>
                  </div>
                  <div>
                    <p class="text-xs text-text-secondary mb-1">Store Monetization</p>
                    <p class="text-lg font-bold text-text-primary">Custom</p>
                    <p class="text-xs text-text-muted mt-0.5">you set your fee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="text-center space-y-3 pb-6">
        <h2 class="text-lg sm:text-xl font-bold text-text-primary">Ready to Launch Your Marketplace?</h2>
        <p class="text-sm text-text-secondary max-w-xl mx-auto">
          Get started in minutes. No credit card required for setup. 
          We'll help you configure everything exactly how you want it.
        </p>
        <div class="flex flex-col sm:flex-row gap-2 justify-center items-center">
          <button class="px-5 py-2.5 bg-primary-color hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm">
            <Icon icon="mdi:rocket-launch" class="w-4 h-4" />
            Get Started Now
          </button>
          <button class="px-5 py-2.5 bg-card-bg border border-border-color hover:border-primary-color text-text-primary font-semibold rounded-lg transition-colors text-sm">
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
