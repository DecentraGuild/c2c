/**
 * useTheme Composable
 * Provides easy access to theme properties and methods
 */

import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

export function useTheme() {
  const themeStore = useThemeStore()
  
  // Current theme
  const theme = computed(() => themeStore.currentTheme)
  const colors = computed(() => themeStore.colors)
  const fonts = computed(() => themeStore.fonts)
  const fontSize = computed(() => themeStore.fontSize)
  const spacing = computed(() => themeStore.spacing)
  const borderRadius = computed(() => themeStore.borderRadius)
  const borderWidth = computed(() => themeStore.borderWidth)
  const branding = computed(() => themeStore.branding)
  const shadows = computed(() => themeStore.shadows)
  const gradients = computed(() => themeStore.gradients)
  
  // Helper functions
  const getColor = (category, variant = 'main') => {
    return colors.value[category]?.[variant] || colors.value.primary.main
  }
  
  const getRadius = (size = 'md') => {
    return borderRadius.value[size] || borderRadius.value.md
  }
  
  const getBorderWidth = (size = 'thin') => {
    return borderWidth.value[size] || borderWidth.value.thin
  }
  
  const getFontSize = (size = 'base') => {
    return fontSize.value[size] || fontSize.value.base
  }
  
  const getSpacing = (size = 'md') => {
    return spacing.value[size] || spacing.value.md
  }
  
  const getShadow = (type = 'card') => {
    return shadows.value[type] || shadows.value.card
  }
  
  const getGradient = (type = 'primary') => {
    return gradients.value[type] || gradients.value.primary
  }
  
  return {
    // Theme data
    theme,
    colors,
    fonts,
    fontSize,
    spacing,
    borderRadius,
    borderWidth,
    branding,
    shadows,
    gradients,
    
    // Helper functions
    getColor,
    getRadius,
    getBorderWidth,
    getFontSize,
    getSpacing,
    getShadow,
    getGradient,
    
    // Store methods
    loadTheme: themeStore.loadTheme,
    loadThemeFromJson: themeStore.loadThemeFromJson,
    loadThemeFromNFT: themeStore.loadThemeFromNFT,
    resetToDefault: themeStore.resetToDefault,
    isLoading: computed(() => themeStore.isLoading),
    error: computed(() => themeStore.error),
    isCustomTheme: computed(() => themeStore.isCustomTheme),
  }
}
