/**
 * Composable for debounced search query
 * Syncs a search query ref to a debounced ref to avoid excessive filtering/API calls.
 *
 * @param {import('vue').Ref<string>} searchQueryRef - Reactive search query (e.g. v-model)
 * @param {Object} options - Options
 * @param {number} options.delay - Debounce delay in ms (default: DEBOUNCE_DELAYS.MEDIUM)
 * @returns {{ debouncedQuery: import('vue').Ref<string> }} Debounced query ref
 */

import { ref, watch } from 'vue'
import { DEBOUNCE_DELAYS } from '@/utils/constants'
import { simpleDebounce } from '@/utils/debounce'

export function useDebouncedSearch(searchQueryRef, { delay = DEBOUNCE_DELAYS.MEDIUM } = {}) {
  const debouncedQuery = ref(searchQueryRef.value ?? '')

  const updateDebounced = simpleDebounce((value) => {
    debouncedQuery.value = value
  }, delay)

  watch(searchQueryRef, (value) => {
    updateDebounced(value)
  }, { immediate: true })

  return { debouncedQuery }
}
