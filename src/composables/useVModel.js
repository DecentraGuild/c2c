/**
 * Composable for creating v-model compatible computed properties
 * Simplifies the creation of multiple v-model bindings
 */

import { computed } from 'vue'

/**
 * Create v-model compatible computed properties from props and emits
 * @param {Object} props - Component props
 * @param {Function} emit - Component emit function
 * @param {string[]} propNames - Array of prop names to create v-model for
 * @returns {Object} Object with computed properties for each prop name
 */
export function useVModel(props, emit, propNames) {
  const vModels = {}
  
  propNames.forEach(propName => {
    vModels[`local${propName.charAt(0).toUpperCase() + propName.slice(1)}`] = computed({
      get: () => props[propName],
      set: (val) => emit(`update:${propName}`, val)
    })
  })
  
  return vModels
}
