/**
 * Composable for clipboard operations
 */

import { ref, computed } from 'vue'
import { logError } from '../utils/logger'

export function useClipboard() {
  const isCopying = ref(false)

  const copyToClipboard = async (text) => {
    if (!text) return false

    isCopying.value = true
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      logError('Failed to copy to clipboard:', error)
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      } catch (fallbackError) {
        logError('Fallback copy failed:', fallbackError)
        return false
      }
    } finally {
      isCopying.value = false
    }
  }

  return {
    // State (computed for reactivity)
    isCopying: computed(() => isCopying.value),
    
    // Methods
    copyToClipboard
  }
}
