/**
 * Wallet Detection Utility
 * Single entry: initializeWalletDetection() called once from main.js for mobile Wallet Standard support.
 */

import { logDebug, logWarning } from './logger'
import { UI_CONSTANTS } from './constants/ui'

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
function waitForWalletStandard(maxWait = undefined) {
  const waitMs = maxWait ?? UI_CONSTANTS.WALLET_STANDARD_MAX_WAIT_MS
  const pollMs = UI_CONSTANTS.WALLET_STANDARD_POLL_MS
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window.navigator?.wallets || window.solana)) {
      resolve(true)
      return
    }
    let attempts = 0
    const maxAttempts = Math.max(1, Math.floor(waitMs / pollMs))
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
    }, pollMs)
  })
}

/**
 * Single entry: initialize wallet detection for mobile. Called once from main.js at bootstrap.
 * On mobile (especially in-app browsers), Wallet Standard can inject late; we wait up to
 * WALLET_STANDARD_MAX_WAIT_MS so the wallet picker sees Backpack etc.
 */
export async function initializeWalletDetection() {
  if (!isMobileDevice() || typeof window === 'undefined') {
    return
  }

  logDebug('[Wallet Detection] Mobile: waiting for Wallet Standard...')
  const available = await waitForWalletStandard(UI_CONSTANTS.WALLET_STANDARD_MAX_WAIT_MS)

  if (available && window.navigator?.wallets && Array.isArray(window.navigator.wallets)) {
    logDebug('[Wallet Detection] Available:', window.navigator.wallets.map(w => w.name || w.id))
  } else if (!available) {
    logWarning('[Wallet Detection] Wallet Standard not detected; wallets may appear after a moment.')
  }
}
