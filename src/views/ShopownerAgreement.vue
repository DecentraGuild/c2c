<template>
  <div class="min-h-screen bg-primary-bg py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Back link -->
      <router-link
        to="/"
        class="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary-color transition-colors mb-6"
      >
        <Icon icon="mdi:arrow-left" class="w-4 h-4" />
        Back to home
      </router-link>

      <article class="terms-content text-text-primary">
        <h1 class="text-2xl sm:text-3xl font-bold mb-2">Shopowner Subscription Agreement</h1>
        <p class="text-sm text-text-muted mb-1">DecentraGuild Multitenant Marketplace Services</p>
        <p class="text-sm text-text-muted mb-8">Last updated: February 1, 2026</p>

        <p class="text-text-secondary text-sm leading-relaxed mb-8">
          This Shopowner Subscription Agreement (&quot;Agreement&quot;) governs the subscription-based access to branded storefront and marketplace configuration services provided by DecentraGuild.
        </p>
        <p class="text-text-secondary text-sm leading-relaxed mb-8">
          This Agreement forms part of the overall contractual framework together with the general Terms of Service (&quot;ToS&quot;).
        </p>
        <p class="text-text-secondary text-sm leading-relaxed mb-8">
          By creating, operating, or subscribing to a storefront on the Platform, you (&quot;Shopowner&quot;) agree to be bound by this Agreement.
        </p>

        <!-- 1. Operator Information -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">1. Operator Information</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            The services are provided by:
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            <strong>DecentraGuild</strong><br>
            Planned place of incorporation: Zug, Switzerland<br>
            (Full registration details to be added upon incorporation)
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            DecentraGuild provides a software interface enabling Shopowners to deploy and operate branded storefronts that interact with Solana smart contracts in a non-custodial manner.
          </p>
        </section>

        <!-- 2. Purpose and Scope -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">2. Purpose and Scope</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            This Agreement governs:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Subscription access to Shopowner storefront services</li>
            <li>Storefront branding and configuration features</li>
            <li>Supported asset and currency settings</li>
            <li>Subscription fees and add-ons</li>
            <li>Verification-based upgrades</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            DecentraGuild provides only technical infrastructure and is not a party to any transactions executed through Shopowner storefronts.
          </p>
        </section>

        <!-- 3. Definitions -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">3. Definitions</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            For purposes of this Agreement:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm">
            <li>&quot;Platform&quot; means the DecentraGuild marketplace interface.</li>
            <li>&quot;Shopowner&quot; means any user operating a branded storefront.</li>
            <li>&quot;Storefront&quot; means a configured marketplace instance under Shopowner branding.</li>
            <li>&quot;Digital Assets&quot; include NFTs, SPL tokens, and gaming-related assets.</li>
            <li>&quot;Supported Currencies&quot; include SOL, USDC, USDT, WBTC, and approved SPL tokens.</li>
            <li>&quot;Custom Currency&quot; means an SPL token added by the Shopowner as settlement currency.</li>
          </ul>
        </section>

        <!-- 4. Subscription Plans -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">4. Subscription Plans</h2>

          <h3 class="text-base font-semibold mb-2 mt-4">4.1 Community Store (Base Subscription)</h3>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            All Shopowners begin with the Community Store plan.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-2">Includes:</p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Fully branded storefront</li>
            <li>Support for up to 250 mints/collections</li>
            <li>Ability to list and trade NFTs, tokens, and digital assets</li>
            <li>Standard supported currencies (SOL, USDC, USDT, WBTC)</li>
            <li>Ability to configure Shopowner marketplace fees</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed mb-4">
            <strong>Subscription Fee:</strong> USD 50/month (payable in cryptocurrency)
          </p>

          <h3 class="text-base font-semibold mb-2 mt-4">4.2 Official Store Upgrade (Verification-Based)</h3>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Shopowners may unlock Official Store features by completing on-chain verification of collection ownership.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-2">Includes:</p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Official verification badge</li>
            <li>Enhanced trust signal for buyers</li>
            <li>Royalty routing control (where supported)</li>
            <li>One Custom Currency included at no extra cost</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            <strong>Upgrade Fee:</strong> Free upon successful verification
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            DecentraGuild reserves the right to define technical verification requirements.
          </p>
        </section>

        <!-- 5. Additional Add-Ons and Fees -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">5. Additional Add-Ons and Fees</h2>

          <h3 class="text-base font-semibold mb-2 mt-4">5.1 Additional Mints</h3>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Shopowners may expand supported collections beyond the base limit.
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-4">
            <li>Base: 250 mints included</li>
            <li>Additional: USD 10/month per additional 50 mints</li>
          </ul>

          <h3 class="text-base font-semibold mb-2 mt-4">5.2 Custom Currency Add-On</h3>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Shopowners may add custom SPL tokens as settlement currencies.
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Custom currency add-on: USD 5/month</li>
            <li>First custom currency free with Official Store verification</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            Shopowners acknowledge that adding custom currencies may increase regulatory and technical risk.
          </p>
        </section>

        <!-- 6. Marketplace Fees and Monetization -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">6. Marketplace Fees and Monetization</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Shopowners may configure additional fees (&quot;Shopowner Fees&quot;) applied to trades executed through their Storefront.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Shopowner Fees may be:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Fixed fees</li>
            <li>Percentage-based fees</li>
            <li>Structured similarly to royalties where supported</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Shopowners are solely responsible for:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Disclosing Shopowner Fees to end-users</li>
            <li>Ensuring compliance with applicable law</li>
            <li>Any tax obligations arising from fee revenue</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            DecentraGuild does not guarantee any earnings or profitability.
          </p>
        </section>

        <!-- 7. Platform-Level Trading Fees -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">7. Platform-Level Trading Fees</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            The following Platform-level fees apply across all storefronts:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Maker fee: 0.001 SOL</li>
            <li>Taker fee: 0.0006 SOL</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            In addition, collection-level on-chain royalties may apply depending on the asset. All fees are enforced automatically through smart contract execution.
          </p>
        </section>

        <!-- 8. Payment Terms -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">8. Payment Terms</h2>

          <h3 class="text-base font-semibold mb-2 mt-4">8.1 Crypto Payments Only</h3>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Subscription fees are intended to be paid exclusively in cryptocurrency.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Shopowners acknowledge:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-4">
            <li>Crypto payments are irreversible</li>
            <li>Exchange rates may fluctuate</li>
            <li>Shopowners remain responsible for tax reporting</li>
          </ul>

          <h3 class="text-base font-semibold mb-2 mt-4">8.2 Billing Cycle</h3>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Subscriptions are billed on a monthly basis.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Failure to pay may result in:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm">
            <li>Suspension of storefront features</li>
            <li>Loss of add-ons</li>
            <li>Termination of Shopowner access</li>
          </ul>
        </section>

        <!-- 9. Shopowner Responsibilities -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">9. Shopowner Responsibilities</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Shopowners are solely responsible for:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Storefront content, branding, and configuration</li>
            <li>Listings displayed through their Storefront</li>
            <li>Compliance with consumer, IP, and commercial laws</li>
            <li>Collection verification claims</li>
            <li>User communications and dispute handling</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            Shopowners must not misrepresent affiliation with DecentraGuild.
          </p>
        </section>

        <!-- 10. No Agency or Partnership -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">10. No Agency or Partnership</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Nothing in this Agreement creates:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Partnership</li>
            <li>Joint venture</li>
            <li>Agency</li>
            <li>Employment relationship</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            Shopowners operate independently and at their own risk.
          </p>
        </section>

        <!-- 11. Disputes Between Users -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">11. Disputes Between Users</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            All transactions executed through Storefronts are peer-to-peer.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            DecentraGuild:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Is not a party to sales contracts</li>
            <li>Does not mediate disputes</li>
            <li>Has no obligation to enforce Shopowner policies</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            Shopowners are responsible for handling disputes arising from their Storefront activity.
          </p>
        </section>

        <!-- 12. Technical Risks and Disclaimer -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">12. Technical Risks and Disclaimer</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Shopowners acknowledge risks including:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Smart contract vulnerabilities</li>
            <li>Network congestion or Solana outages</li>
            <li>Token volatility</li>
            <li>Wallet compromise</li>
            <li>Irreversible execution of blockchain transactions</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            The storefront services are provided &quot;as is&quot; without warranties.
          </p>
        </section>

        <!-- 13. Limitation of Liability -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">13. Limitation of Liability</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            To the maximum extent permitted under Swiss law:
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            DecentraGuild shall not be liable for:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Loss of revenue or marketplace earnings</li>
            <li>User disputes or chargebacks</li>
            <li>Misconfigured fees or currencies</li>
            <li>Smart contract exploits or blockchain failures</li>
            <li>Regulatory consequences arising from Shopowner activity</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            Liability is limited to intentional misconduct or gross negligence where mandatory law applies.
          </p>
        </section>

        <!-- 14. Termination -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">14. Termination</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            DecentraGuild may suspend or terminate Shopowner subscriptions if:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Fees remain unpaid</li>
            <li>Shopowner violates the ToS or this Agreement</li>
            <li>Required for legal or security reasons</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Upon termination:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm">
            <li>Subscription access ends</li>
            <li>On-chain assets remain under user control</li>
            <li>Past payments are non-refundable unless required by law</li>
          </ul>
        </section>

        <!-- 15. Amendments -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">15. Amendments</h2>
          <p class="text-text-secondary text-sm leading-relaxed">
            DecentraGuild may revise subscription pricing or features with reasonable notice. Continued use constitutes acceptance of updated terms.
          </p>
        </section>

        <!-- 16. Governing Law and Jurisdiction -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">16. Governing Law and Jurisdiction</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            This Agreement is governed by Swiss law.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            Exclusive jurisdiction lies with the competent courts of Zug, Switzerland, unless mandatory law provides otherwise.
          </p>
        </section>

        <!-- 17. Contact -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">17. Contact</h2>
          <p class="text-text-secondary text-sm leading-relaxed">
            Legal inquiries:
            <a href="mailto:team@decentraguild.com" class="text-primary-color hover:underline">team@decentraguild.com</a><br>
            Business inquiries:
            <a href="mailto:team@decentraguild.com" class="text-primary-color hover:underline">team@decentraguild.com</a>
          </p>
        </section>
      </article>

      <div class="pt-6 border-t border-border-color">
        <router-link
          to="/"
          class="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary-color transition-colors"
        >
          <Icon icon="mdi:arrow-left" class="w-4 h-4" />
          Back to home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
</script>
