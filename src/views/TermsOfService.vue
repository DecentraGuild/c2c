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
        <h1 class="text-2xl sm:text-3xl font-bold mb-2">Terms of Service</h1>
        <p class="text-sm text-text-muted mb-1">DecentraGuild Multitenant Marketplace Protocol</p>
        <p class="text-sm text-text-muted mb-8">Last updated: February 1, 2026</p>

        <p class="text-text-secondary text-sm leading-relaxed mb-8">
          These Terms of Service (&quot;Terms&quot;) govern access to and use of the DecentraGuild marketplace interface and related services (the &quot;Platform&quot;).
        </p>
        <p class="text-text-secondary text-sm leading-relaxed mb-8">
          By accessing or using the Platform, you confirm that you have read, understood, and agreed to be bound by these Terms.
        </p>

        <!-- 1. Operator Information -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">1. Operator Information</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            The Platform is operated by:
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            <strong>DecentraGuild</strong><br>
            Planned place of incorporation: Zug, Switzerland<br>
            (Company registration details to be added upon incorporation)
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            DecentraGuild provides a software-based, non-custodial interface for peer-to-peer interaction with smart contracts deployed on the Solana blockchain.
          </p>
        </section>

        <!-- 2. Nature of the Platform -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">2. Nature of the Platform (Technical Intermediary Only)</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            The Platform is a multitenant marketplace infrastructure that enables users and third-party Shopowners to:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Display and discover digital assets</li>
            <li>Interact with Solana smart contracts</li>
            <li>Conduct peer-to-peer trades through self-custodied wallets</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            DecentraGuild acts solely as a technical service provider.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            DecentraGuild does not:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm">
            <li>act as broker, dealer, agent, or fiduciary</li>
            <li>provide custodial services</li>
            <li>operate an exchange under Swiss financial market regulation</li>
            <li>become a contractual party to user-to-user transactions</li>
          </ul>
        </section>

        <!-- 3. Supported Assets and Trades -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">3. Supported Assets and Trades</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            The Platform supports peer-to-peer trading of:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Non-fungible tokens (NFTs)</li>
            <li>Tokenized gaming assets</li>
            <li>SPL tokens and other Solana-based digital assets</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Trades may include:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>NFT &#8596; Token swaps</li>
            <li>Token &#8596; Token swaps</li>
            <li>NFT &#8596; NFT swaps</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            Users acknowledge that digital assets may carry different legal classifications depending on jurisdiction.
          </p>
        </section>

        <!-- 4. Non-Custodial Operation -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">4. Non-Custodial Operation</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            The Platform is fully non-custodial.
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Users connect via third-party wallets</li>
            <li>Users retain full control over private keys and assets</li>
            <li>DecentraGuild cannot access, transfer, or recover user funds</li>
            <li>All transactions require explicit user approval via wallet signature.</li>
          </ul>
        </section>

        <!-- 5. Orders, Escrow and Finality -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">5. Orders, Escrow and Finality</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Marketplace orders may be placed through smart contract escrow mechanisms.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Users acknowledge:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm">
            <li>Open orders may be cancellable prior to execution</li>
            <li>Once a trade is filled, blockchain settlement is final and irreversible</li>
            <li>DecentraGuild has no ability to reverse or modify completed transactions</li>
          </ul>
        </section>

        <!-- 6. Multitenant Shopowners and Storefronts -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">6. Multitenant Shopowners and Storefronts</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Third-party users (&quot;Shopowners&quot;) may create and operate independent storefronts using the Platform.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Shopowners may configure:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Supported collections (up to 250)</li>
            <li>Supported currencies (including SPL tokens)</li>
            <li>Additional marketplace fees or royalties where technically supported</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Shopowners are solely responsible for:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Their listings and storefront content</li>
            <li>Collection verification claims</li>
            <li>Compliance with applicable consumer, tax, and IP laws</li>
            <li>Any additional fees they impose</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            DecentraGuild does not supervise or endorse Shopowner activity.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            Subscription terms, plans, and fees for Shopowners are set out in the
            <router-link to="/shopowner-agreement" class="text-primary-color hover:underline">Shopowner Subscription Agreement</router-link>.
          </p>
        </section>

        <!-- 7. Fees and Royalties -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">7. Fees and Royalties</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Platform-level fees may include:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Maker fee: 0.001 SOL</li>
            <li>Taker fee: 0.0006 SOL</li>
            <li>Subscription fees payable by Shopowners</li>
            <li>Collection-level on-chain royalties</li>
            <li>Optional Shopowner-added fees</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            Fees are enforced automatically by smart contract logic. All fees are displayed or technically determinable prior to execution.
          </p>
        </section>

        <!-- 8. Subscription Payments -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">8. Subscription Payments (Crypto Only)</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Shopowner subscription services are intended to be paid exclusively in cryptocurrency. DecentraGuild does not currently require fiat payment processing.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Users acknowledge that:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm">
            <li>crypto payments may fluctuate in value</li>
            <li>blockchain payments are generally irreversible</li>
            <li>tax reporting obligations remain with the paying party</li>
          </ul>
        </section>

        <!-- 9. User Eligibility -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">9. User Eligibility</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            By using the Platform, you represent that:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm">
            <li>You are at least 18 years old</li>
            <li>You have legal capacity to enter into these Terms</li>
            <li>You are not prohibited from using blockchain services under applicable law</li>
          </ul>
        </section>

        <!-- 10. Prohibited Use -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">10. Prohibited Use</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Users may not use the Platform to:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>engage in fraudulent or deceptive conduct</li>
            <li>violate sanctions or export control laws</li>
            <li>facilitate money laundering or terrorist financing</li>
            <li>trade stolen or unlawfully issued assets</li>
            <li>interfere with smart contract functionality</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            DecentraGuild may restrict access where required for legal compliance or security.
          </p>
        </section>

        <!-- 11. Risk Disclosure -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">11. Risk Disclosure (Blockchain and Smart Contracts)</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Users acknowledge and accept all risks inherent in blockchain-based systems, including:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>smart contract vulnerabilities</li>
            <li>network outages or congestion</li>
            <li>validator or protocol failures</li>
            <li>irreversible asset loss</li>
            <li>phishing attacks and wallet compromise</li>
            <li>token volatility and lack of valuation guarantees</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            The Platform is provided &quot;as is&quot; without warranties of uninterrupted availability.
          </p>
        </section>

        <!-- 12. Limitation of Liability -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">12. Limitation of Liability</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            To the maximum extent permitted under Swiss law (Swiss Code of Obligations):
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            DecentraGuild shall not be liable for:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>loss of digital assets</li>
            <li>transaction failures or execution errors</li>
            <li>Shopowner conduct or third-party storefront activity</li>
            <li>smart contract exploits or protocol vulnerabilities</li>
            <li>loss of profits or indirect damages</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            Liability is limited to cases of intentional misconduct or gross negligence where mandatory law applies.
          </p>
        </section>

        <!-- 13. No Financial or Investment Advice -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">13. No Financial or Investment Advice</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Nothing on the Platform constitutes:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>investment advice</li>
            <li>financial intermediation</li>
            <li>brokerage services</li>
            <li>solicitation to trade securities</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            Users act entirely at their own risk.
          </p>
        </section>

        <!-- 14. Intellectual Property -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">14. Intellectual Property</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            All Platform software, interface design, trademarks, and documentation remain the property of DecentraGuild.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            Shopowners grant DecentraGuild a limited license to display storefront branding solely for marketplace functionality.
          </p>
        </section>

        <!-- 15. Data Protection -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">15. Data Protection</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            The Platform processes limited technical data, including:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>wallet addresses</li>
            <li>on-chain transaction references</li>
            <li>subscription-related information (Shopowners)</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            A separate
            <router-link to="/privacy" class="text-primary-color hover:underline">Privacy Policy</router-link>
            will govern data processing under the Swiss Federal Act on Data Protection (FADP) and, where applicable, GDPR.
          </p>
        </section>

        <!-- 16. Governing Law and Jurisdiction -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">16. Governing Law and Jurisdiction</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            These Terms are governed by the laws of Switzerland.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            Exclusive jurisdiction shall lie with the competent courts of Zug, Switzerland, unless mandatory law provides otherwise.
          </p>
        </section>

        <!-- 17. Amendments -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">17. Amendments</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            DecentraGuild may revise these Terms from time to time.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            Continued use of the Platform constitutes acceptance of updated Terms.
          </p>
        </section>

        <!-- 18. Contact -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">18. Contact</h2>
          <p class="text-text-secondary text-sm leading-relaxed">
            Legal contact:
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
