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
        <h1 class="text-2xl sm:text-3xl font-bold mb-2">DecentraGuild Privacy Policy</h1>
        <p class="text-sm text-text-muted mb-8">Last updated: February 1, 2026</p>

        <p class="text-text-secondary text-sm leading-relaxed mb-8">
          DecentraGuild (&quot;we,&quot; &quot;our,&quot; or &quot;the Platform&quot;) respects your privacy and is committed to protecting personal data in accordance with the Swiss Federal Act on Data Protection (FADP) and, where applicable, the EU General Data Protection Regulation (GDPR).
        </p>
        <p class="text-text-secondary text-sm leading-relaxed mb-8">
          This Privacy Policy explains what data we collect, how it is used, and your rights.
        </p>

        <!-- 1. Data Controller -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">1. Data Controller</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            The data controller for the Platform is:
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            <strong>DecentraGuild</strong><br>
            Planned incorporation: Zug, Switzerland<br>
            (Contact details to be added upon registration)
          </p>
        </section>

        <!-- 2. Personal Data We Collect -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">2. Personal Data We Collect</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            We may collect and process the following data from users and Shopowners:
          </p>

          <h3 class="text-base font-semibold mb-2 mt-4">2.1 Wallet and Blockchain Data</h3>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Wallet addresses</li>
            <li>On-chain transaction activity related to the Platform</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            This is necessary to facilitate non-custodial trades and subscription tracking.
          </p>

          <h3 class="text-base font-semibold mb-2 mt-4">2.2 Shopowner Information</h3>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Company name, personal name (if applicable)</li>
            <li>Contact email</li>
            <li>Billing information (cryptocurrency wallet address)</li>
          </ul>

          <h3 class="text-base font-semibold mb-2 mt-4">2.3 Optional Future Data</h3>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm">
            <li>Analytics or usage tracking (if enabled later)</li>
            <li>Support messages via Discord/email (if support channels are implemented)</li>
          </ul>
        </section>

        <!-- 3. How We Use Personal Data -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">3. How We Use Personal Data</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            We use your personal data only for:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Operating and maintaining the Platform</li>
            <li>Facilitating subscriptions and billing for Shopowners</li>
            <li>Providing Platform features, including storefronts and transaction history</li>
            <li>Communicating with Shopowners about the Platform and subscription services</li>
            <li>Compliance with legal obligations</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            We do not sell or rent personal data to third parties.
          </p>
        </section>

        <!-- 4. Legal Basis for Processing -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">4. Legal Basis for Processing</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Under Swiss law and GDPR (where applicable), we process personal data:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm">
            <li>To fulfill contractual obligations (subscriptions, storefront operation)</li>
            <li>For legitimate interests (Platform maintenance, fraud prevention, compliance)</li>
            <li>As required by applicable law or regulations</li>
          </ul>
        </section>

        <!-- 5. Data Retention -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">5. Data Retention</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            We retain personal data only for as long as necessary to:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Provide Platform services</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes or enforce agreements</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            On-chain transaction data remains on the Solana blockchain and is outside our control.
          </p>
        </section>

        <!-- 6. Data Sharing -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">6. Data Sharing</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            We may share personal data only:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>With service providers who help operate the Platform (e.g., cloud hosting)</li>
            <li>If legally required by authorities</li>
            <li>In connection with mergers, acquisitions, or business transfers (if any)</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            We do not share personal data for marketing purposes without consent.
          </p>
        </section>

        <!-- 7. Your Rights -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">7. Your Rights</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            Users and Shopowners may exercise the following rights under FADP and GDPR (where applicable):
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Access to personal data</li>
            <li>Rectification of inaccurate data</li>
            <li>Request deletion of personal data (where legally permitted)</li>
            <li>Object to processing based on legitimate interests</li>
            <li>Withdraw consent (where processing is based on consent)</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            Requests can be made via
            <a href="mailto:team@decentraguild.com" class="text-primary-color hover:underline">team@decentraguild.com</a>.
          </p>
        </section>

        <!-- 8. Security -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">8. Security</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            We implement reasonable technical and organizational measures to protect personal data, including:
          </p>
          <ul class="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
            <li>Secure storage of subscription information</li>
            <li>Encryption and authentication for Platform access</li>
            <li>Regular monitoring and system updates</li>
          </ul>
          <p class="text-text-secondary text-sm leading-relaxed">
            However, blockchain transactions are irreversible, and wallet security is the responsibility of the user.
          </p>
        </section>

        <!-- 9. Cookies and Analytics -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">9. Cookies and Analytics (Future Use)</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            At launch, we do not use cookies or analytics tools.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            If we implement tracking in the future, this Privacy Policy will be updated accordingly.
          </p>
        </section>

        <!-- 10. Third-Party Services -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">10. Third-Party Services</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            The Platform interacts with the Solana blockchain and may integrate SPL tokens, NFTs, or other decentralized services.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            We do not control the processing of data on third-party blockchain networks.
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            Any data submitted to external networks is subject to their own terms.
          </p>
        </section>

        <!-- 11. Changes to This Policy -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">11. Changes to This Policy</h2>
          <p class="text-text-secondary text-sm leading-relaxed">
            We may update this Privacy Policy to reflect changes in the Platform, legal requirements, or operational practices. The updated version will be posted on the Platform with a revised &quot;Last Updated&quot; date.
          </p>
        </section>

        <!-- 12. Contact -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold mb-3">12. Contact</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-3">
            For questions, data requests, or privacy concerns:
          </p>
          <p class="text-text-secondary text-sm leading-relaxed">
            Email:
            <a href="mailto:team@decentraguild.com" class="text-primary-color hover:underline">team@decentraguild.com</a><br>
            Address: to be added upon registration
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
