/**
 * Theme Store
 * Manages theme configuration including colors, fonts, logos, and styling
 * Prepared for custom skinning from NFT/JSON metadata in the future
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { logError, logWarning } from '../utils/logger'

// Default theme configuration (green primary, red secondary theme)
const defaultTheme = {
  id: 'default',
  name: 'dGuild P2P',
  description: 'Default green primary theme with red accents for dGuild Escrow',
  
  // Colors - Primary (green) and Secondary (red for links/accents)
  colors: {
    primary: {
      main: '#00951a',      // Green - main color
      hover: '#00b820',     // Brighter green on hover
      light: '#00cc22',     // Lighter green
      dark: '#007a14',      // Darker green
    },
    secondary: {
      main: '#cf0000',      // Red - for links and accents
      hover: '#b30000',     // Darker red on hover
      light: '#ff3333',     // Lighter red
      dark: '#990000',      // Dark red
    },
    accent: {
      main: '#8b5cf6',      // Purple accent
      hover: '#7c3aed',
    },
    background: {
      primary: '#0a0a0f',   // Dark background
      secondary: '#141420',  // Slightly lighter
      card: '#1a1a2e',      // Card background
    },
    text: {
      primary: '#ffffff',   // White
      secondary: '#a0a0b3',  // Light gray
      muted: '#6b6b80',     // Muted gray
    },
    border: {
      default: '#2a2a3e',   // Border color
      light: '#3a3a4e',
    },
    status: {
      success: '#00951a',   // Green
      error: '#cf0000',     // Red
      warning: '#ff6b35',   // Orange
      info: '#00d4ff',      // Cyan
    },
    trade: {
      buy: '#00ff00',       // Green for buy orders
      buyHover: '#00cc00',
      buyLight: '#33ff33',
      sell: '#ff0000',      // Red for sell orders
      sellHover: '#cc0000',
      sellLight: '#ff3333',
      trade: '#ffaa00',     // Orange/amber for trade orders
      tradeHover: '#cc8800',
      tradeLight: '#ffbb33',
    },
    window: {
      background: '#1a1a2e',  // Window/modal background
      border: '#2a2a3e',       // Window border
      header: '#141420',       // Window header background
    }
  },
  
  // Typography
  fonts: {
    primary: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  
  // Border radius
  borderRadius: {
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    xl: '1.25rem',  // 20px
    full: '9999px',
  },
  
  // Border width
  borderWidth: {
    thin: '1px',
    medium: '2px',
    thick: '4px',
  },
  
  // Logo and branding
  branding: {
    logo: '/dguild-logo-p2p.svg',
    name: 'dGuild Escrow',
    shortName: 'dGuild',
  },
  
  // Shadows
  shadows: {
    glow: '0 0 20px rgba(0, 149, 26, 0.3)',        // Green glow
    glowHover: '0 0 40px rgba(0, 149, 26, 0.6)',   // Stronger green glow
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  
  // Gradients - primarily green with some variation
  gradients: {
    primary: 'linear-gradient(135deg, #00951a 0%, #00cc22 50%, #007a14 100%)',  // Green gradient with fade
    secondary: 'linear-gradient(135deg, #ff6b35 0%, #f59e0b 100%)',
    accent: 'linear-gradient(135deg, #00951a 0%, #cf0000 100%)',  // Green to red for accents
  },
  
  // Metadata for future NFT/JSON loading
  metadata: {
    source: 'default',  // 'default' | 'nft' | 'json'
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  }
}

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref(defaultTheme)
  const isLoading = ref(false)
  const error = ref(null)
  const isCustomTheme = ref(false)  // Whether theme is loaded from external source
  
  // Local storage keys
  const STORAGE_KEYS = {
    SELECTED_THEME: 'dguild_escrow_selected_theme',
    THEME_DATA: 'dguild_escrow_theme_data'
  }
  
  // Computed properties for easy access
  const colors = computed(() => currentTheme.value.colors)
  const fonts = computed(() => currentTheme.value.fonts)
  const borderRadius = computed(() => currentTheme.value.borderRadius)
  const borderWidth = computed(() => currentTheme.value.borderWidth)
  const branding = computed(() => currentTheme.value.branding)
  const shadows = computed(() => currentTheme.value.shadows)
  const gradients = computed(() => currentTheme.value.gradients)
  
  // CSS custom properties for theming
  const cssVariables = computed(() => {
    const theme = currentTheme.value
    return {
      // Primary colors (green)
      '--theme-primary': theme.colors.primary.main,
      '--theme-primary-hover': theme.colors.primary.hover,
      '--theme-primary-light': theme.colors.primary.light,
      '--theme-primary-dark': theme.colors.primary.dark,
      
      // Secondary colors (red - for links/accents)
      '--theme-secondary': theme.colors.secondary.main,
      '--theme-secondary-hover': theme.colors.secondary.hover,
      '--theme-secondary-light': theme.colors.secondary.light,
      '--theme-secondary-dark': theme.colors.secondary.dark,
      
      // Accent colors
      '--theme-accent': theme.colors.accent.main,
      '--theme-accent-hover': theme.colors.accent.hover,
      
      // Background colors
      '--theme-bg-primary': theme.colors.background.primary,
      '--theme-bg-secondary': theme.colors.background.secondary,
      '--theme-bg-card': theme.colors.background.card,
      
      // Text colors
      '--theme-text-primary': theme.colors.text.primary,
      '--theme-text-secondary': theme.colors.text.secondary,
      '--theme-text-muted': theme.colors.text.muted,
      
      // Border colors
      '--theme-border': theme.colors.border.default,
      '--theme-border-light': theme.colors.border.light,
      
      // Status colors
      '--theme-success': theme.colors.status.success,
      '--theme-error': theme.colors.status.error,
      '--theme-warning': theme.colors.status.warning,
      '--theme-info': theme.colors.status.info,
      
      // Trade colors (buy/sell/trade)
      '--theme-trade-buy': theme.colors.trade.buy,
      '--theme-trade-buy-hover': theme.colors.trade.buyHover,
      '--theme-trade-buy-light': theme.colors.trade.buyLight,
      '--theme-trade-sell': theme.colors.trade.sell,
      '--theme-trade-sell-hover': theme.colors.trade.sellHover,
      '--theme-trade-sell-light': theme.colors.trade.sellLight,
      '--theme-trade-trade': theme.colors.trade.trade,
      '--theme-trade-trade-hover': theme.colors.trade.tradeHover,
      '--theme-trade-trade-light': theme.colors.trade.tradeLight,
      
      // Window colors
      '--theme-window-bg': theme.colors.window.background,
      '--theme-window-border': theme.colors.window.border,
      '--theme-window-header': theme.colors.window.header,
      
      // Border radius
      '--theme-radius-sm': theme.borderRadius.sm,
      '--theme-radius-md': theme.borderRadius.md,
      '--theme-radius-lg': theme.borderRadius.lg,
      '--theme-radius-xl': theme.borderRadius.xl,
      '--theme-radius-full': theme.borderRadius.full,
      
      // Border width
      '--theme-border-thin': theme.borderWidth.thin,
      '--theme-border-medium': theme.borderWidth.medium,
      '--theme-border-thick': theme.borderWidth.thick,
      
      // Gradients
      '--theme-gradient-primary': theme.gradients.primary,
      '--theme-gradient-secondary': theme.gradients.secondary,
      '--theme-gradient-accent': theme.gradients.accent,
      
      // Shadows
      '--theme-shadow-glow': theme.shadows.glow,
      '--theme-shadow-glow-hover': theme.shadows.glowHover,
      '--theme-shadow-card': theme.shadows.card,
    }
  })
  
  // Actions
  const loadTheme = async (themeData) => {
    try {
      isLoading.value = true
      error.value = null
      
      // Validate theme data structure
      if (!themeData || typeof themeData !== 'object') {
        throw new Error('Invalid theme data')
      }
      
      // Merge with default theme to ensure all properties exist
      const mergedTheme = {
        ...defaultTheme,
        ...themeData,
        colors: {
          ...defaultTheme.colors,
          ...(themeData.colors || {}),
          primary: {
            ...defaultTheme.colors.primary,
            ...(themeData.colors?.primary || {}),
          },
          secondary: {
            ...defaultTheme.colors.secondary,
            ...(themeData.colors?.secondary || {}),
          },
          accent: {
            ...defaultTheme.colors.accent,
            ...(themeData.colors?.accent || {}),
          },
          background: {
            ...defaultTheme.colors.background,
            ...(themeData.colors?.background || {}),
          },
          text: {
            ...defaultTheme.colors.text,
            ...(themeData.colors?.text || {}),
          },
          border: {
            ...defaultTheme.colors.border,
            ...(themeData.colors?.border || {}),
          },
          status: {
            ...defaultTheme.colors.status,
            ...(themeData.colors?.status || {}),
          },
          trade: {
            ...defaultTheme.colors.trade,
            ...(themeData.colors?.trade || {}),
          },
          window: {
            ...defaultTheme.colors.window,
            ...(themeData.colors?.window || {}),
          },
        },
        borderRadius: {
          ...defaultTheme.borderRadius,
          ...(themeData.borderRadius || {}),
        },
        borderWidth: {
          ...defaultTheme.borderWidth,
          ...(themeData.borderWidth || {}),
        },
        branding: {
          ...defaultTheme.branding,
          ...(themeData.branding || {}),
        },
        shadows: {
          ...defaultTheme.shadows,
          ...(themeData.shadows || {}),
        },
        gradients: {
          ...defaultTheme.gradients,
          ...(themeData.gradients || {}),
        },
      }
      
      currentTheme.value = mergedTheme
      isCustomTheme.value = themeData.metadata?.source !== 'default'
      
      // Save to localStorage
      saveThemeToStorage(mergedTheme)
      
      // Apply theme to document
      applyThemeToDocument()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load theme'
      logError('Theme loading error:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  // Load theme from JSON/NFT (prepared for future implementation)
  const loadThemeFromJson = async (jsonUrl) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await fetch(jsonUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch theme: ${response.statusText}`)
      }
      
      const themeData = await response.json()
      
      // Add metadata
      themeData.metadata = {
        ...themeData.metadata,
        source: 'json',
        loadedAt: new Date().toISOString(),
      }
      
      await loadTheme(themeData)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load theme from JSON'
      logError('Theme JSON loading error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Load theme from NFT metadata (prepared for future implementation)
  const loadThemeFromNFT = async (nftMetadata) => {
    try {
      isLoading.value = true
      error.value = null
      
      // Extract theme data from NFT metadata
      // This is a placeholder for future NFT integration
      const themeData = nftMetadata.theme || nftMetadata.attributes?.theme
      
      if (!themeData) {
        throw new Error('No theme data found in NFT metadata')
      }
      
      // Add metadata
      themeData.metadata = {
        ...themeData.metadata,
        source: 'nft',
        nftAddress: nftMetadata.address,
        loadedAt: new Date().toISOString(),
      }
      
      await loadTheme(themeData)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load theme from NFT'
      logError('Theme NFT loading error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Reset to default theme
  const resetToDefault = () => {
    currentTheme.value = defaultTheme
    isCustomTheme.value = false
    clearThemeFromStorage()
    applyThemeToDocument()
  }
  
  // Apply theme CSS variables to document
  const applyThemeToDocument = () => {
    const root = document.documentElement
    Object.entries(cssVariables.value).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })
  }
  
  // Persistence
  const saveThemeToStorage = (theme) => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME_DATA, JSON.stringify(theme))
      localStorage.setItem(STORAGE_KEYS.SELECTED_THEME, theme.id)
    } catch (err) {
      logWarning('Failed to save theme to localStorage:', err)
    }
  }
  
  const loadThemeFromStorage = () => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME_DATA)
      if (savedTheme) {
        const themeData = JSON.parse(savedTheme)
        return themeData
      }
    } catch (err) {
      logWarning('Failed to load theme from localStorage:', err)
    }
    return null
  }
  
  const clearThemeFromStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.THEME_DATA)
      localStorage.removeItem(STORAGE_KEYS.SELECTED_THEME)
    } catch (err) {
      logWarning('Failed to clear theme from localStorage:', err)
    }
  }
  
  // Initialize theme on store creation
  const initializeTheme = () => {
    // Always apply default theme CSS variables first (immediate)
    applyThemeToDocument()
    
    // Then try to load saved theme if it exists
    const savedTheme = loadThemeFromStorage()
    if (savedTheme) {
      loadTheme(savedTheme)
    }
  }
  
  // Watch for theme changes and apply to document
  watch(currentTheme, () => {
    applyThemeToDocument()
  }, { deep: true })
  
  return {
    // State
    currentTheme,
    isLoading,
    error,
    isCustomTheme,
    
    // Computed
    colors,
    fonts,
    borderRadius,
    borderWidth,
    branding,
    shadows,
    gradients,
    cssVariables,
    
    // Actions
    loadTheme,
    loadThemeFromJson,
    loadThemeFromNFT,
    resetToDefault,
    applyThemeToDocument,
    initializeTheme,
    
    // Persistence
    saveThemeToStorage,
    loadThemeFromStorage,
    clearThemeFromStorage,
  }
})
