/**
 * Wallet Detection Utility
 * Single entry: initializeWalletDetection() called once from main.js for mobile Wallet Standard support.
 */

import { logDebug, logWarning } from './logger'

/** Max wait (ms) for Wallet Standard on mobile; in-app browsers can inject late. */
const MOBILE_WALLET_STANDARD_WAIT_MS = 6000

/**
 * Check if we're on a mobile device
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Check if we're in an in-app browser (e.g. Backpack in-wallet browser)
 */
export function isInAppBrowser() {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('backpack') ||
         ua.includes('phantom') ||
         ua.includes('solflare') ||
         (ua.includes('wv') && !ua.includes('chrome'))
}

/**
 * Wait for Wallet Standard API to be available (used only inside initializeWalletDetection).
 */
function waitForWalletStandard(maxWait = 5000) {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window.navigator?.wallets || window.solana)) {
      resolve(true)
      return
    }
    let attempts = 0
    const maxAttempts = Math.max(1, Math.floor(maxWait / 100))
    const interval = setInterval(() => {
      attempts++
      if (typeof window !== 'undefined' && (window.navigator?.wallets || window.solana)) {
        clearInterval(interval)
        resolve(true)
        return
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval)
        resolve(false)
      }
    }, 100)
  })
}

/**
 * Single entry: initialize wallet detection for mobile. Called once from main.js at bootstrap.
 * On mobile (especially in-app browsers), Wallet Standard can inject late; we wait up to
 * MOBILE_WALLET_STANDARD_WAIT_MS so the wallet picker sees Backpack etc.
 */
export async function initializeWalletDetection() {
  if (!isMobileDevice() || typeof window === 'undefined') {
    return
  }

  logDebug('[Wallet Detection] Mobile: waiting for Wallet Standard...')
  const available = await waitForWalletStandard(MOBILE_WALLET_STANDARD_WAIT_MS)

  if (available && window.navigator?.wallets && Array.isArray(window.navigator.wallets)) {
    logDebug('[Wallet Detection] Available:', window.navigator.wallets.map(w => w.name || w.id))
  } else if (!available) {
    logWarning('[Wallet Detection] Wallet Standard not detected; wallets may appear after a moment.')
  }
}
