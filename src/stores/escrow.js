/**
 * Escrow Store
 * Manages escrow creation and management state
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { validateSolanaAddress, validateExpirationDate, validateSlippage, validateAmount } from '../utils/validators'
import { fetchAllEscrows } from '../utils/escrowTransactions'
import { useSolanaConnection } from '../composables/useSolanaConnection'
import { fromSmallestUnits } from '../utils/formatters'
import { PublicKey } from '@solana/web3.js'
import { useTokenStore } from './token'
import { formatEscrowData, calculateEscrowStatus } from '../utils/escrowHelpers'
import { toPublicKey } from '../utils/solanaUtils'

export const useEscrowStore = defineStore('escrow', () => {
  // Create escrow form state
  const offerToken = ref(null)
  const offerAmount = ref('0.00')
  const requestToken = ref(null)
  const requestAmount = ref('0.00')
  
  // Settings
  const settings = ref({
    direct: false,
    directAddress: '',
    whitelist: false,
    whitelistAddresses: [],
    expire: false,
    expireDate: null,
    partialFill: false,
    slippage: 1
  })
  
  // Escrows list (from blockchain)
  const escrows = ref([])
  const loadingEscrows = ref(false)
  
  // Centralized error handling
  const errors = ref({
    form: {},
    transaction: null,
    network: null,
    escrows: null
  })
  
  // Computed
  const activeEscrows = computed(() => {
    return escrows.value.filter(e => e.status !== 'closed')
  })
  
  const hasValidOffer = computed(() => {
    return offerToken.value !== null && 
           parseFloat(offerAmount.value) > 0
  })
  
  const hasValidRequest = computed(() => {
    return requestToken.value !== null && 
           parseFloat(requestAmount.value) > 0
  })
  
  const canCreateEscrow = computed(() => {
    return hasValidOffer.value && hasValidRequest.value
  })
  
  const exchangeRate = computed(() => {
    if (!hasValidOffer.value || !hasValidRequest.value) return null
    
    const offer = parseFloat(offerAmount.value)
    const request = parseFloat(requestAmount.value)
    
    if (offer === 0 || request === 0) return null
    
    return {
      offerToRequest: request / offer,
      requestToOffer: offer / request
    }
  })
  
  // Get token store for balance checks
  const tokenStore = useTokenStore()
  
  // Validation computed properties
  const isValidOfferAmount = computed(() => {
    if (!offerToken.value) return false
    const validation = validateAmount(offerAmount.value, {
      min: 0.000001,
      decimals: offerToken.value.decimals,
      balance: tokenStore.getTokenBalance(offerToken.value.mint)
    })
    return validation.valid
  })
  
  const isValidRequestAmount = computed(() => {
    if (!requestToken.value) return false
    const validation = validateAmount(requestAmount.value, {
      min: 0.000001,
      decimals: requestToken.value.decimals
    })
    return validation.valid
  })
  
  const isValidDirectAddress = computed(() => {
    if (!settings.value.direct || !settings.value.directAddress) return true // Optional if not enabled
    const validation = validateSolanaAddress(settings.value.directAddress)
    return validation.valid
  })
  
  const isValidExpireDate = computed(() => {
    if (!settings.value.expire || !settings.value.expireDate) return true // Optional if not enabled
    const validation = validateExpirationDate(settings.value.expireDate)
    return validation.valid
  })
  
  const isValidSlippage = computed(() => {
    if (!settings.value.partialFill) return true // Only validate if partial fill is enabled
    const validation = validateSlippage(settings.value.slippage)
    return validation.valid
  })
  
  const isFormValid = computed(() => {
    return hasValidOffer.value && 
           hasValidRequest.value && 
           isValidDirectAddress.value &&
           isValidExpireDate.value &&
           isValidSlippage.value &&
           // Check that offer and request tokens are different
           (offerToken.value?.mint !== requestToken.value?.mint)
  })
  
  const formValidationErrors = computed(() => {
    const errors = {}
    
    if (!offerToken.value) {
      errors.offerToken = 'Please select a token to offer'
    } else if (!isValidOfferAmount.value) {
      const validation = validateAmount(offerAmount.value, {
        min: 0.000001,
        decimals: offerToken.value.decimals,
        balance: tokenStore.getTokenBalance(offerToken.value.mint)
      })
      errors.offerAmount = validation.error || 'Please enter a valid offer amount'
    }
    
    if (!requestToken.value) {
      errors.requestToken = 'Please select a token to request'
    } else if (!isValidRequestAmount.value) {
      const validation = validateAmount(requestAmount.value, {
        min: 0.000001,
        decimals: requestToken.value.decimals
      })
      errors.requestAmount = validation.error || 'Please enter a valid request amount'
    }
    
    if (offerToken.value && requestToken.value && 
        offerToken.value.mint === requestToken.value.mint) {
      errors.tokens = 'Offer and request tokens must be different'
    }
    
    // Only validate optional settings if they are enabled
    if (settings.value.direct && settings.value.directAddress && !isValidDirectAddress.value) {
      errors.directAddress = validateSolanaAddress(settings.value.directAddress).error
    }
    
    if (settings.value.expire && settings.value.expireDate && !isValidExpireDate.value) {
      errors.expireDate = validateExpirationDate(settings.value.expireDate).error
    }
    
    if (settings.value.partialFill && !isValidSlippage.value) {
      errors.slippage = validateSlippage(settings.value.slippage).error
    }
    
    return errors
  })
  
  // Actions
  const setOfferToken = (token) => {
    offerToken.value = token
  }
  
  const setOfferAmount = (amount) => {
    // Ensure amount is always a string
    offerAmount.value = typeof amount === 'number' ? amount.toString() : (amount || '0.00')
  }
  
  const setRequestToken = (token) => {
    requestToken.value = token
  }
  
  const setRequestAmount = (amount) => {
    // Ensure amount is always a string
    requestAmount.value = typeof amount === 'number' ? amount.toString() : (amount || '0.00')
  }
  
  const updateSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings }
  }
  
  const resetForm = () => {
    offerToken.value = null
    offerAmount.value = '0.00'
    requestToken.value = null
    requestAmount.value = '0.00'
    settings.value = {
      direct: false,
      directAddress: '',
      whitelist: false,
      whitelistAddresses: [],
      expire: false,
      expireDate: null,
      partialFill: false,
      slippage: 1
    }
  }
  
  const addEscrow = (escrow) => {
    escrows.value.unshift(escrow)
  }
  
  const updateEscrow = (escrowId, updates) => {
    const index = escrows.value.findIndex(e => e.id === escrowId)
    if (index !== -1) {
      escrows.value[index] = { ...escrows.value[index], ...updates }
    }
  }
  
  const removeEscrow = (escrowId) => {
    escrows.value = escrows.value.filter(e => e.id !== escrowId)
  }
  
  const loadEscrows = async (makerPublicKey = null) => {
    loadingEscrows.value = true
    errors.value.escrows = null
    try {
      const connection = useSolanaConnection()
      const tokenStore = useTokenStore()
      
      // Convert makerPublicKey to PublicKey if it's a string
      const makerFilter = makerPublicKey 
        ? toPublicKey(makerPublicKey)
        : null
      
      // Fetch escrows from blockchain
      const rawEscrows = await fetchAllEscrows(connection, makerFilter)
      
      // Format escrows with token information
      const formattedEscrows = await Promise.all(
        rawEscrows.map(async (escrowData) => {
          const escrowAccount = escrowData.account
          const escrowPubkey = escrowData.publicKey
          
          // Fetch token info for deposit and request tokens
          const [depositTokenInfo, requestTokenInfo] = await Promise.all([
            tokenStore.fetchTokenInfo(escrowAccount.depositToken.toString()),
            tokenStore.fetchTokenInfo(escrowAccount.requestToken.toString())
          ])
          
          // Format escrow data using helper function
          const formatted = formatEscrowData(
            { account: escrowAccount, publicKey: escrowPubkey },
            depositTokenInfo,
            requestTokenInfo
          )
          
          // Add createdAt timestamp (TODO: Get from transaction signature if available)
          return {
            ...formatted,
            createdAt: new Date().toISOString()
          }
        })
      )
      
      escrows.value = formattedEscrows
    } catch (error) {
      console.error('Failed to load escrows:', error)
      errors.value.escrows = error.message || 'Failed to load escrows'
    } finally {
      loadingEscrows.value = false
    }
  }
  
  const validateForm = () => {
    errors.value.form = formValidationErrors.value
    return isFormValid.value
  }
  
  const clearFormErrors = () => {
    errors.value.form = {}
  }
  
  const clearErrors = () => {
    errors.value = {
      form: {},
      transaction: null,
      network: null,
      escrows: null
    }
  }
  
  const setError = (type, error) => {
    if (type === 'form' && typeof error === 'object') {
      errors.value.form = error
    } else {
      errors.value[type] = error
    }
  }
  
  return {
    // State
    offerToken,
    offerAmount,
    requestToken,
    requestAmount,
    settings,
    escrows,
    loadingEscrows,
    errors,
    
    // Computed
    activeEscrows,
    hasValidOffer,
    hasValidRequest,
    canCreateEscrow,
    exchangeRate,
    isValidOfferAmount,
    isValidRequestAmount,
    isValidDirectAddress,
    isValidExpireDate,
    isValidSlippage,
    isFormValid,
    formValidationErrors,
    
    // Actions
    setOfferToken,
    setOfferAmount,
    setRequestToken,
    setRequestAmount,
    updateSettings,
    resetForm,
    addEscrow,
    updateEscrow,
    removeEscrow,
    loadEscrows,
    validateForm,
    clearFormErrors,
    clearErrors,
    setError
  }
})
