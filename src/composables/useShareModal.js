/**
 * Share Modal Composable
 * Provides reusable share modal state and logic
 */

import { ref } from 'vue'

export function useShareModal() {
  const showShare = ref(false)
  const shareUrl = ref('')

  /**
   * Open share modal with URL
   * @param {string} url - URL to share (defaults to current page URL)
   */
  const open = (url = null) => {
    shareUrl.value = url || window.location.href
    showShare.value = true
  }

  /**
   * Close share modal
   */
  const close = () => {
    showShare.value = false
  }

  return {
    showShare,
    shareUrl,
    open,
    close
  }
}
