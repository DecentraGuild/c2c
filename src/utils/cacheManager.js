/**
 * Cache Manager Utility
 * Centralized cache management for token metadata and other cached data
 * Extracted from token store for better organization and reusability
 */

import { STORAGE_KEYS, CACHE_CONFIG } from './constants/ui'
import { logDebug } from './logger'

/**
 * Get cached data from localStorage
 * @param {string} key - Storage key
 * @returns {*} Cached data or null
 */
export function getCachedData(key) {
  try {
    const data = localStorage.getItem(key)
    if (data) {
      return JSON.parse(data)
    }
  } catch (err) {
    logDebug('Failed to read cache:', err)
  }
  return null
}

/**
 * Set data in localStorage cache
 * @param {string} key - Storage key
 * @param {*} data - Data to cache
 * @returns {boolean} Success status
 */
export function setCachedData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (err) {
    logDebug('Failed to write cache:', err)
    // If storage is full, try to clear old cache and retry
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN_METADATA)
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (clearErr) {
      logDebug('Failed to clear and write cache:', clearErr)
      return false
    }
  }
}

/**
 * Check if cache is still valid
 * @param {number} timestamp - Cache timestamp
 * @param {number} ttl - Time to live in milliseconds
 * @returns {boolean} True if cache is valid
 */
export function isCacheValid(timestamp, ttl) {
  if (!timestamp) return false
  return Date.now() - timestamp < ttl
}

/**
 * Clear cache for a specific key
 * @param {string} key - Storage key
 */
export function clearCache(key) {
  try {
    localStorage.removeItem(key)
  } catch (err) {
    logDebug(`Failed to clear cache for ${key}:`, err)
  }
}

/**
 * Clear all application caches
 */
export function clearAllCaches() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key.includes('cache') || key.includes('Cache')) {
        localStorage.removeItem(key)
      }
    })
  } catch (err) {
    logDebug('Failed to clear all caches:', err)
  }
}

/**
 * Get cache size in bytes (approximate)
 * @param {string} key - Storage key
 * @returns {number} Size in bytes
 */
export function getCacheSize(key) {
  try {
    const data = localStorage.getItem(key)
    return data ? new Blob([data]).size : 0
  } catch (err) {
    logDebug(`Failed to get cache size for ${key}:`, err)
    return 0
  }
}

/**
 * Limit cache entries to prevent storage overflow
 * @param {Array} entries - Cache entries array
 * @param {number} maxEntries - Maximum entries to keep
 * @returns {Array} Limited entries array
 */
export function limitCacheEntries(entries, maxEntries = CACHE_CONFIG.MAX_METADATA_ENTRIES) {
  if (!Array.isArray(entries)) return []
  if (entries.length <= maxEntries) return entries
  return entries.slice(-maxEntries)
}
