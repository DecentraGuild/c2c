/**
 * Network Status Composable
 * Provides network connectivity status and handling
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { useToast } from './useToast'
import { NETWORK_MESSAGES } from '@/utils/errorMessages'

export function useNetworkStatus() {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const { warning } = useToast()

  const handleOnline = () => {
    isOnline.value = true
  }

  const handleOffline = () => {
    isOnline.value = false
    warning(NETWORK_MESSAGES.OFFLINE_WARNING)
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })

  return {
    isOnline
  }
}
