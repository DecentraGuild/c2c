/**
 * Storefront Store
 * Manages storefronts (tenants). Each storefront = a set of collectionMints (NFT collections + tokens/SFTs/currencies)
 * from our JSON configs. When loading a storefront that has NFT collections, we load those collections' metadata and individual mints.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logError, logDebug } from '@/utils/logger'
import { useThemeStore } from '@/stores/theme'
import { filterEscrowsByStorefront, filterActiveEscrows } from '@/utils/marketplaceHelpers'
import { useStorefrontMetadataStore } from '@/stores/storefrontMetadata'

export const useStorefrontStore = defineStore('storefront', () => {
  const storefronts = ref([])
  const loadingStorefronts = ref(false)
  const error = ref(null)
  const selectedStorefrontId = ref(null)

  /**
   * Storefront structure (from JSON):
   * Required: id, name. Optional: logo, description, collectionMints, baseCurrency, customCurrencies,
   * colors, shopFee, verification_status, subscriptionActive, tradeDiscount, etc.
   * Visual tweaks (all optional; merged with theme default): colors, fontSize, spacing, borderRadius,
   * borderWidth, shadows, gradients. See THEMING_GUIDE.md "Storefront JSON visual keys".
   */

  const activeStorefronts = computed(() => {
    return storefronts.value.filter(s => s.subscriptionActive)
  })

  const selectedStorefront = computed(() => {
    if (!selectedStorefrontId.value) return null
    return storefronts.value.find(s => s.id === selectedStorefrontId.value)
  })

  const setStorefronts = (newStorefronts) => {
    storefronts.value = newStorefronts
  }

  const addStorefront = (storefront) => {
    const exists = storefronts.value.find(s => s.id === storefront.id)
    if (exists) {
      const index = storefronts.value.findIndex(s => s.id === storefront.id)
      storefronts.value[index] = { ...storefronts.value[index], ...storefront }
    } else {
      storefronts.value.push(storefront)
    }
  }

  const removeStorefront = (storefrontId) => {
    storefronts.value = storefronts.value.filter(s => s.id !== storefrontId)
  }

  const preloadingStorefronts = ref(new Set())
  const LAST_STOREFRONT_STORAGE_KEY = 'c2c_last_storefront_id'

  const setSelectedStorefront = (storefrontId) => {
    selectedStorefrontId.value = storefrontId
    if (storefrontId) {
      try {
        localStorage.setItem(LAST_STOREFRONT_STORAGE_KEY, storefrontId)
      } catch (e) {
        // Ignore storage errors (private mode, quota)
      }
    }

    // Storefront theme is applied route-aware in App.vue (only on marketplace/create/manage/escrow)
    const storefront = storefronts.value.find(s => s.id === storefrontId)
    if (storefront && !preloadingStorefronts.value.has(storefront.id)) {
      const storefrontMetadataStore = useStorefrontMetadataStore()
      if (storefrontMetadataStore.isLoading(storefront.id)) return
      const cachedNFTs = storefrontMetadataStore.getCachedNFTs(storefront.id)
      if (cachedNFTs.length > 0) return
      preloadingStorefronts.value.add(storefront.id)
      storefrontMetadataStore.preloadStorefrontNFTs(storefront)
        .then(() => preloadingStorefronts.value.delete(storefront.id))
        .catch(err => {
          logError('Failed to preload storefront NFTs:', err)
          preloadingStorefronts.value.delete(storefront.id)
        })
    }
  }

  const loadStorefrontTheme = (storefront) => {
    try {
      const themeStore = useThemeStore()
      const themeData = {
        id: storefront.id,
        name: storefront.name,
        description: storefront.description || `Theme for ${storefront.name}`,
        colors: storefront.colors,
        branding: {
          logo: storefront.logo || '/dguild-logo-p2p.svg',
          name: storefront.name,
          shortName: storefront.name,
        },
        metadata: {
          source: 'storefront',
          storefrontId: storefront.id,
          loadedAt: new Date().toISOString(),
        }
      }
      if (storefront.fontSize) themeData.fontSize = storefront.fontSize
      if (storefront.spacing) themeData.spacing = storefront.spacing
      if (storefront.borderRadius) themeData.borderRadius = storefront.borderRadius
      if (storefront.borderWidth) themeData.borderWidth = storefront.borderWidth
      if (storefront.shadows) themeData.shadows = storefront.shadows
      if (storefront.gradients) themeData.gradients = storefront.gradients
      themeStore.loadTheme(themeData)
      logDebug(`Loaded theme for storefront: ${storefront.name}`)
    } catch (err) {
      logError('Failed to load storefront theme:', err)
    }
  }

  const clearSelectedStorefront = () => {
    selectedStorefrontId.value = null
  }

  const loadStorefronts = async () => {
    loadingStorefronts.value = true
    error.value = null
    try {
      const storefrontFiles = [
        '/Collections/DecentraGuild/decentraguild.json',
        '/Collections/Star Atlas/star-atlas.json',
        '/Collections/Skull & Bones/skull-bones.json',
        '/Collections/Race Protocol/race-protocol.json'
      ]
      const loaded = await Promise.all(
        storefrontFiles.map(async (file) => {
          try {
            const response = await fetch(file)
            if (!response.ok) throw new Error(`Failed to load ${file}`)
            return await response.json()
          } catch (err) {
            logError(`Failed to load storefront file ${file}:`, err)
            return null
          }
        })
      )
      storefronts.value = loaded.filter(s => s !== null)
      if (!selectedStorefrontId.value && storefronts.value.length > 0) {
        try {
          const lastId = localStorage.getItem(LAST_STOREFRONT_STORAGE_KEY)
          if (lastId && storefronts.value.some(s => s.id === lastId)) {
            setSelectedStorefront(lastId)
          }
        } catch (e) {}
      }
      logDebug(`Loaded ${storefronts.value.length} storefronts`)
    } catch (err) {
      logError('Failed to load storefronts:', err)
      error.value = err.message || 'Failed to load storefronts'
    } finally {
      loadingStorefronts.value = false
    }
  }

  const registerStorefront = async (storefrontData) => {
    loadingStorefronts.value = true
    error.value = null
    try {
      addStorefront({
        ...storefrontData,
        id: storefrontData.collectionMint || `storefront-${Date.now()}`,
        verification_status: storefrontData.verification_status || 'community',
        subscriptionActive: true,
        tradeDiscount: { enabled: true, appliesTo: 'all' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      logDebug('Storefront registered (local only - awaiting backend)')
    } catch (err) {
      logError('Failed to register storefront:', err)
      error.value = err.message || 'Failed to register storefront'
      throw err
    } finally {
      loadingStorefronts.value = false
    }
  }

  const upgradeToVerified = async (storefrontId, signature) => {
    loadingStorefronts.value = true
    error.value = null
    try {
      const storefront = storefronts.value.find(s => s.id === storefrontId)
      if (storefront) {
        storefront.verification_status = 'verified'
        storefront.updatedAt = new Date().toISOString()
        logDebug(`Storefront ${storefrontId} upgraded to verified`)
      }
      logDebug('Storefront upgraded to verified (local only - awaiting backend)')
    } catch (err) {
      logError('Failed to upgrade storefront:', err)
      error.value = err.message || 'Failed to upgrade storefront'
      throw err
    } finally {
      loadingStorefronts.value = false
    }
  }

  const isVerified = (storefrontIdOrStorefront) => {
    const storefront = typeof storefrontIdOrStorefront === 'string'
      ? storefronts.value.find(s => s.id === storefrontIdOrStorefront)
      : storefrontIdOrStorefront
    if (!storefront) return false
    return storefront.verification_status === 'verified' || storefront.verified === true
  }

  const isCommunityStore = (storefrontIdOrStorefront) => {
    const storefront = typeof storefrontIdOrStorefront === 'string'
      ? storefronts.value.find(s => s.id === storefrontIdOrStorefront)
      : storefrontIdOrStorefront
    if (!storefront) return false
    return storefront.verification_status === 'community' ||
           (storefront.verification_status !== 'verified' && !storefront.verified)
  }

  const isStorefrontActive = (storefrontId) => {
    const storefront = storefronts.value.find(s => s.id === storefrontId)
    if (!storefront || !storefront.subscriptionActive) return false
    if (storefront.subscriptionExpiresAt) {
      return new Date(storefront.subscriptionExpiresAt) > new Date()
    }
    return true
  }

  const getStorefrontByMint = (mintAddress) => {
    return storefronts.value.find(s => s.collectionMint === mintAddress || s.id === mintAddress)
  }

  const refreshOpenTradesCounts = (allEscrows) => {
    try {
      if (!allEscrows) {
        storefronts.value.forEach(s => { s.openTradesCount = 0 })
        return
      }
      if (allEscrows.length === 0) {
        storefronts.value.forEach(s => { s.openTradesCount = 0 })
        return
      }
      const metadataStore = useStorefrontMetadataStore()
      const escrowsByStorefront = new Map()
      storefronts.value.forEach(storefront => {
        const cachedNFTs = metadataStore.getCachedNFTs(storefront.id) || []
        const cachedMints = new Set(
          cachedNFTs.map(n => (n?.mint && String(n.mint).toLowerCase()) || null).filter(Boolean)
        )
        const matchedEscrows = filterEscrowsByStorefront(allEscrows, storefront, { cachedCollectionMints: cachedMints })
        const activeEscrows = filterActiveEscrows(matchedEscrows)
        escrowsByStorefront.set(storefront.id, activeEscrows.length)
      })
      storefronts.value.forEach(storefront => {
        storefront.openTradesCount = escrowsByStorefront.get(storefront.id) || 0
      })
      logDebug(`Updated open trades counts for ${storefronts.value.length} storefronts`)
    } catch (err) {
      logError('Failed to refresh open trades counts:', err)
      storefronts.value.forEach(s => { s.openTradesCount = 0 })
    }
  }

  const getOpenTradesCount = (storefrontId) => {
    const storefront = storefronts.value.find(s => s.id === storefrontId)
    return storefront ? (storefront.openTradesCount || 0) : 0
  }

  const setOpenTradesCount = (storefrontId, count) => {
    const storefront = storefronts.value.find(s => s.id === storefrontId)
    if (storefront) storefront.openTradesCount = count
  }

  // Theme is applied route-aware in App.vue (only on marketplace/create/manage/escrow)

  return {
    storefronts,
    loadingStorefronts,
    error,
    selectedStorefrontId,
    activeStorefronts,
    selectedStorefront,
    setStorefronts,
    addStorefront,
    removeStorefront,
    setSelectedStorefront,
    clearSelectedStorefront,
    loadStorefronts,
    registerStorefront,
    upgradeToVerified,
    isStorefrontActive,
    getStorefrontByMint,
    loadStorefrontTheme,
    getOpenTradesCount,
    setOpenTradesCount,
    refreshOpenTradesCounts,
    isVerified,
    isCommunityStore
  }
})
