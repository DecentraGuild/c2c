/**
 * Composable for clipboard operations
 */

import { ref } from 'vue'

export function useClipboard() {
  const isCopying = ref(false)

  const copyToClipboard = async (text) => {
    if (!text) return false

    isCopying.value = true
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
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
        console.error('Fallback copy failed:', fallbackError)
        return false
      }
    } finally {
      isCopying.value = false
    }
  }

  return {
    isCopying,
    copyToClipboard
  }
}
