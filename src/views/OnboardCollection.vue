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
      <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="bg-card-bg border border-border-color rounded-lg p-4 text-center">
          <Icon icon="mdi:shield-lock-outline" class="w-10 h-10 text-primary-color mx-auto mb-3" />
          <h3 class="text-base font-bold text-text-primary mb-1.5">Self-Custody</h3>
          <p class="text-xs text-text-secondary">The program handles the trade while your users keep control of their assets.</p>
        </div>
        <div class="bg-card-bg border border-border-color rounded-lg p-4 text-center">
          <Icon icon="mdi:palette" class="w-10 h-10 text-primary-color mx-auto mb-3" />
          <h3 class="text-base font-bold text-text-primary mb-1.5">Full Branding</h3>
          <p class="text-xs text-text-secondary">Customize everything to match your brand—it's your storefront.</p>
        </div>
        <div class="bg-card-bg border border-border-color rounded-lg p-4 text-center">
          <Icon icon="mdi:wallet" class="w-10 h-10 text-primary-color mx-auto mb-3" />
          <h3 class="text-base font-bold text-text-primary mb-1.5">Multi-Currency</h3>
          <p class="text-xs text-text-secondary">Accept USDC, USDT, SOL, and WBTC. Add custom tokens as an add-on.</p>
        </div>
        <div class="bg-card-bg border border-border-color rounded-lg p-4 text-center">
          <Icon icon="mdi:currency-usd" class="w-10 h-10 text-primary-color mx-auto mb-3" />
          <h3 class="text-base font-bold text-text-primary mb-1.5">Set Your Fees</h3>
          <p class="text-xs text-text-secondary">Monetize your marketplace with your own fee.</p>
        </div>
        <div class="bg-card-bg border border-border-color rounded-lg p-4 text-center">
          <Icon icon="mdi:shield-check" class="w-10 h-10 text-primary-color mx-auto mb-3" />
          <h3 class="text-base font-bold text-text-primary mb-1.5">Royalties Protected</h3>
          <p class="text-xs text-text-secondary">Creator royalties are respected on every trade.</p>
        </div>
      </div>

      <!-- Billing toggle -->
      <div class="flex flex-col items-center gap-3">
        <span class="text-sm text-text-secondary">Billing</span>
        <div class="inline-flex rounded-lg border border-border-color bg-card-bg p-0.5">
          <button
            type="button"
            :class="billingInterval === 'monthly' ? 'bg-primary-color text-white' : 'text-text-secondary hover:text-text-primary'"
            class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
            @click="billingInterval = 'monthly'"
          >
            Monthly
          </button>
          <button
            type="button"
            :class="billingInterval === 'yearly' ? 'bg-primary-color text-white' : 'text-text-secondary hover:text-text-primary'"
            class="rounded-md px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
            @click="billingInterval = 'yearly'"
          >
            Yearly
            <span class="inline-flex items-center gap-0.5 rounded bg-primary-color/20 text-primary-color text-xs font-bold px-1.5 py-0.5">50% off</span>
          </button>
        </div>
      </div>

      <!-- Store Types Comparison -->
      <div class="space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-xl sm:text-2xl font-bold text-text-primary">Start with Community Store</h2>
          <p class="text-base text-text-secondary max-w-2xl mx-auto">
            All stores start at {{ billingSummary }}. Verify your collection ownership on-chain to unlock
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
                <p class="text-2xl font-bold text-text-primary mb-0.5">
                  ${{ displayPrice }}<span class="text-base text-text-secondary font-normal">/{{ billingInterval === 'monthly' ? 'month' : 'year' }}</span>
                  <span v-if="billingInterval === 'yearly'" class="ml-2 inline-flex items-center rounded bg-primary-color/20 text-primary-color text-xs font-bold px-1.5 py-0.5">50% off</span>
                </p>
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

          <div class="flex flex-col items-center gap-3 mb-6">
            <span class="text-sm text-text-secondary">Billing</span>
            <div class="inline-flex rounded-lg border border-border-color bg-secondary-bg p-0.5">
              <button
                type="button"
                :class="billingInterval === 'monthly' ? 'bg-primary-color text-white' : 'text-text-secondary hover:text-text-primary'"
                class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
                @click="billingInterval = 'monthly'"
              >
                Monthly
              </button>
              <button
                type="button"
                :class="billingInterval === 'yearly' ? 'bg-primary-color text-white' : 'text-text-secondary hover:text-text-primary'"
                class="rounded-md px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
                @click="billingInterval = 'yearly'"
              >
                Yearly
                <span class="inline-flex items-center gap-0.5 rounded bg-primary-color/20 text-primary-color text-xs font-bold px-1.5 py-0.5">50% off</span>
              </button>
            </div>
          </div>

          <div class="grid md:grid-cols-3 gap-4 mb-6">
            <div class="text-center py-4 px-3 rounded-lg bg-secondary-bg">
              <div class="text-3xl font-bold text-text-primary mb-1.5">${{ displayPrice }}</div>
              <div class="text-sm text-text-secondary mb-1">{{ billingInterval === 'monthly' ? 'Base Monthly Fee' : 'Base Yearly Fee' }}</div>
              <div class="text-sm text-text-secondary mb-2">per {{ billingInterval === 'monthly' ? 'month' : 'year' }}</div>
              <div v-if="billingInterval === 'yearly'" class="text-xs text-primary-color font-medium mb-1">50% off vs monthly</div>
              <div class="text-xs text-text-muted">Includes branded storefront + 250 mints</div>
            </div>
            <div class="text-center py-4 px-3 rounded-lg bg-secondary-bg">
              <div class="text-3xl font-bold text-text-primary mb-1.5">${{ addonExtraMintsPrice }}</div>
              <div class="text-sm text-text-secondary mb-2">Per 50 Additional Mints</div>
              <div class="text-sm text-text-secondary mb-1">per {{ billingInterval === 'monthly' ? 'month' : 'year' }}</div>
              <div v-if="billingInterval === 'yearly'" class="text-xs text-primary-color font-medium mb-1">50% off vs monthly</div>
              <div class="text-xs text-text-muted">250 mints included in base</div>
            </div>
            <div class="text-center py-4 px-3 rounded-lg bg-secondary-bg">
              <div class="text-3xl font-bold text-text-primary mb-1.5">${{ addonCustomCurrencyPrice }}</div>
              <div class="text-sm text-text-secondary mb-2">Custom Currency Add-on</div>
              <div class="text-sm text-text-secondary mb-1">per {{ billingInterval === 'monthly' ? 'month' : 'year' }}</div>
              <div v-if="billingInterval === 'yearly'" class="text-xs text-primary-color font-medium mb-1">50% off vs monthly</div>
              <div class="text-xs text-text-muted">first free with verification</div>
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

      <!-- Technical Details (fold/unfold) -->
      <div class="bg-card-bg border border-border-color rounded-xl p-5 lg:p-8">
        <button
          type="button"
          @click="technicalDetailsOpen = !technicalDetailsOpen"
          class="w-full flex items-center justify-between gap-2 text-left group"
        >
          <h2 class="text-xl font-bold text-text-primary">Technical Details</h2>
          <Icon
            :icon="technicalDetailsOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
            class="w-6 h-6 text-text-muted group-hover:text-text-primary transition-colors flex-shrink-0"
          />
        </button>
        <div v-show="technicalDetailsOpen" class="mt-4 overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-border-color">
                <th class="py-3 pr-4 text-sm font-semibold text-text-primary">Label</th>
                <th class="py-3 pr-4 text-sm font-semibold text-text-primary">Value / content</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              <tr class="border-b border-border-color">
                <td class="py-3 pr-4 text-text-secondary align-top">Escrow Program ID</td>
                <td class="py-3 pr-4 text-text-primary">
                  <span class="font-mono break-all">{{ technical.escrowProgramId }}</span>
                  <button
                    type="button"
                    @click.stop="copyTechnicalItem(technical.escrowProgramId, 'escrow')"
                    class="inline-flex align-middle ml-1.5 p-0.5 rounded hover:bg-secondary-bg transition-colors text-text-muted hover:text-text-primary"
                    title="Copy"
                  >
                    <Icon :icon="copyState === 'escrow' ? 'svg-spinners:ring-resize' : 'mdi:content-copy'" :class="copyState === 'escrow' ? 'text-primary-color' : ''" class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr class="border-b border-border-color">
                <td class="py-3 pr-4 text-text-secondary align-top">Base currencies</td>
                <td class="py-3 pr-4 text-text-primary">
                  <ul class="space-y-1.5">
                    <li v-for="c in technical.baseCurrenciesList" :key="c.symbol" class="flex items-center gap-2 flex-wrap">
                      <span class="font-mono text-xs break-all">{{ c.symbol }} ({{ c.mint }})</span>
                      <button
                        type="button"
                        @click.stop="copyTechnicalItem(c.mint, 'base-' + c.symbol)"
                        class="p-0.5 rounded hover:bg-secondary-bg transition-colors text-text-muted hover:text-text-primary flex-shrink-0"
                        title="Copy mint"
                      >
                        <Icon :icon="copyState === 'base-' + c.symbol ? 'svg-spinners:ring-resize' : 'mdi:content-copy'" :class="copyState === 'base-' + c.symbol ? 'text-primary-color' : ''" class="w-4 h-4" />
                      </button>
                    </li>
                  </ul>
                </td>
              </tr>
              <tr class="border-b border-border-color">
                <td class="py-3 pr-4 text-text-secondary align-top">Token programs supported (current)</td>
                <td class="py-3 pr-4 text-text-primary">
                  <ul class="space-y-1.5">
                    <li v-for="p in technical.tokenProgramsCurrent" :key="p.id" class="flex items-center gap-2 flex-wrap">
                      <span>{{ p.label }}</span>
                      <span class="font-mono text-xs break-all">{{ p.address }}</span>
                      <button
                        type="button"
                        @click.stop="copyTechnicalItem(p.address, p.copyKey)"
                        class="p-0.5 rounded hover:bg-secondary-bg transition-colors text-text-muted hover:text-text-primary flex-shrink-0"
                        title="Copy"
                      >
                        <Icon :icon="copyState === p.copyKey ? 'svg-spinners:ring-resize' : 'mdi:content-copy'" :class="copyState === p.copyKey ? 'text-primary-color' : ''" class="w-4 h-4" />
                      </button>
                    </li>
                  </ul>
                </td>
              </tr>
              <tr class="border-b border-border-color">
                <td class="py-3 pr-4 text-text-secondary align-top">Token programs supported (future)</td>
                <td class="py-3 pr-4 text-text-primary">
                  <ul class="space-y-1.5">
                    <li v-for="p in technical.tokenProgramsFuture" :key="p.copyKey || p.label" class="flex items-center gap-2 flex-wrap">
                      <span>{{ p.label }}</span>
                      <span v-if="p.address" class="font-mono text-xs break-all">{{ p.address }}</span>
                      <span v-else class="text-text-muted text-xs">—</span>
                      <button
                        v-if="p.address"
                        type="button"
                        @click.stop="copyTechnicalItem(p.address, p.copyKey)"
                        class="p-0.5 rounded hover:bg-secondary-bg transition-colors text-text-muted hover:text-text-primary flex-shrink-0"
                        title="Copy"
                      >
                        <Icon :icon="copyState === p.copyKey ? 'svg-spinners:ring-resize' : 'mdi:content-copy'" :class="copyState === p.copyKey ? 'text-primary-color' : ''" class="w-4 h-4" />
                      </button>
                    </li>
                  </ul>
                </td>
              </tr>
              <tr class="border-b border-border-color">
                <td class="py-3 pr-4 text-text-secondary align-top">Whitelist (extra feature)</td>
                <td class="py-3 pr-4 text-text-primary">
                  <div class="space-y-1.5">
                    <p class="text-text-secondary text-xs">Privatize your storefront and other parts of your organisation.</p>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-mono text-xs break-all">{{ technical.whitelistProgramId }}</span>
                      <button
                        type="button"
                        @click.stop="copyTechnicalItem(technical.whitelistProgramId, 'prog-whitelist')"
                        class="p-0.5 rounded hover:bg-secondary-bg transition-colors text-text-muted hover:text-text-primary flex-shrink-0"
                        title="Copy"
                      >
                        <Icon :icon="copyState === 'prog-whitelist' ? 'svg-spinners:ring-resize' : 'mdi:content-copy'" :class="copyState === 'prog-whitelist' ? 'text-primary-color' : ''" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { TRANSACTION_COSTS } from '@/utils/constants/fees'
import { SUBSCRIPTION_PRICING } from '@/utils/constants/ui'
import { ESCROW_PROGRAM_ID, WHITELIST_PROGRAM_ID } from '@/utils/constants/escrow'
import { BASE_CURRENCIES } from '@/utils/constants/baseCurrencies'
import { TOKEN_PROGRAM_ID_STR, TOKEN_2022_PROGRAM_ID_STR, MPL_CORE_PROGRAM_ID_STR } from '@/utils/constants/tokens'
import { useClipboard } from '@/composables/useClipboard'
import { useToast } from '@/composables/useToast'

const billingInterval = ref('yearly')

const technicalDetailsOpen = ref(false)

const BASE_CURRENCY_ORDER = ['USDC', 'USDT', 'SOL', 'WBTC']

const technical = computed(() => {
  const ordered = BASE_CURRENCY_ORDER.map(sym => BASE_CURRENCIES.find(c => c.symbol === sym)).filter(Boolean)
  return {
    escrowProgramId: ESCROW_PROGRAM_ID,
    whitelistProgramId: WHITELIST_PROGRAM_ID,
    baseCurrenciesList: ordered.map(c => ({ symbol: c.symbol, mint: c.mint })),
    tokenProgramsCurrent: [
      { label: 'SPL Token Program (legacy)', address: TOKEN_PROGRAM_ID_STR, copyKey: 'prog-spl' }
    ],
    tokenProgramsFuture: [
      { label: 'Token-2022', address: TOKEN_2022_PROGRAM_ID_STR, copyKey: 'prog-token2022' },
      { label: 'MPL Core', address: MPL_CORE_PROGRAM_ID_STR, copyKey: 'prog-mplcore' },
      { label: 'cNFT', address: null, copyKey: null }
    ]
  }
})

const copyState = ref(null)

const { copyToClipboard } = useClipboard()
const { success, error: showError } = useToast()

async function copyTechnicalItem(text, stateKey) {
  copyState.value = stateKey
  const copied = await copyToClipboard(text)
  copyState.value = null
  if (copied) {
    success('Copied to clipboard')
  } else {
    showError('Failed to copy')
  }
}

const displayPrice = computed(() =>
  billingInterval.value === 'monthly'
    ? SUBSCRIPTION_PRICING.BASE_MONTHLY_USD
    : SUBSCRIPTION_PRICING.BASE_YEARLY_USD
)

const billingSummary = computed(() =>
  billingInterval.value === 'monthly'
    ? `$${SUBSCRIPTION_PRICING.BASE_MONTHLY_USD}/month ($${SUBSCRIPTION_PRICING.BASE_YEARLY_USD}/year at 50% off)`
    : `$${SUBSCRIPTION_PRICING.BASE_YEARLY_USD}/year (50% off)`
)

const addonExtraMintsPrice = computed(() =>
  billingInterval.value === 'monthly'
    ? SUBSCRIPTION_PRICING.ADDON_EXTRA_MINTS_MONTHLY
    : Math.round(SUBSCRIPTION_PRICING.ADDON_EXTRA_MINTS_MONTHLY * 12 * (1 - SUBSCRIPTION_PRICING.YEARLY_DISCOUNT))
)

const addonCustomCurrencyPrice = computed(() =>
  billingInterval.value === 'monthly'
    ? SUBSCRIPTION_PRICING.ADDON_CUSTOM_CURRENCY_MONTHLY
    : Math.round(SUBSCRIPTION_PRICING.ADDON_CUSTOM_CURRENCY_MONTHLY * 12 * (1 - SUBSCRIPTION_PRICING.YEARLY_DISCOUNT))
)
</script>
