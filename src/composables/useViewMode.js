/**
 * Composable for managing view mode state with persistence
 * Supports 'list', 'card', 'tile' modes
 */

import { ref, watch } from 'vue'
import { logWarning } from '../utils/logger'

/**
 * @param {string} key - Storage key for persistence (e.g., 'dashboard-view-mode')
 * @param {string} defaultValue - Default view mode if none stored
 * @param {boolean} persist - Whether to persist to localStorage
 * @returns {Object} View mode state and methods
 */
export function useViewMode(key = 'view-mode', defaultValue = 'list', persist = true) {
  const getStoredValue = () => {
    if (!persist || typeof window === 'undefined') return defaultValue
    try {
      const stored = localStorage.getItem(key)
      return stored || defaultValue
    } catch {
      return defaultValue
    }
  }

  const viewMode = ref(getStoredValue())

  // Persist to localStorage when viewMode changes
  if (persist) {
    watch(viewMode, (newValue) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, newValue)
        }
      } catch (error) {
        logWarning('Failed to persist view mode:', error)
      }
    })
  }

  return {
    viewMode,
    setViewMode: (mode) => {
      viewMode.value = mode
    }
  }
}
